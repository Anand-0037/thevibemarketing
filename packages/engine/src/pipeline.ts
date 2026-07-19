import {
  runAgentLanes,
  type AgentFleetResult,
} from "./agents/lanes";
import { buildMemo } from "./memo/build";
import type { MemoryStore } from "./memory/store";
import { screenAxes } from "./scoring/axes";
import { firstPassScreen, type FirstPassResult } from "./scoring/first-pass";
import { composeFounderScoreFromGravity } from "./scoring/founder-score";
import { scoreGravityFromSignals } from "./scoring/gravity";
import { coherenceFromSignals, inferTrackRecord } from "./scoring/track-record";
import { dedupeClaims, evaluateClaims } from "./scoring/trust";
import { validateClaims } from "./scoring/validator";
import { defaultThesis } from "./thesis";
import { startRun, step } from "./trace";
import type { Claim, Founder, Memo, Product, Screening, Thesis } from "./types";

export type PipelineResult = {
  run_id: string;
  founder: Founder;
  product?: Product;
  screening: Screening;
  memo: Memo;
  claims: Claim[];
  first_pass: FirstPassResult;
  validator: { flags: string[]; corrected: boolean };
  agents?: AgentFleetResult;
};

/**
 * Full VC Brain happy path: gravity → founder score → trust → 3-axis → memo.
 * Single pipeline used by APIs and smoke paths — do not duplicate in the web app.
 */
export async function runVcBrainPipeline(
  store: MemoryStore,
  founderId: string,
  thesis?: Thesis | null,
): Promise<PipelineResult> {
  const founder = await store.getFounder(founderId);
  if (!founder) throw new Error(`Founder not found: ${founderId}`);

  const product = await store.getProductForFounder(founderId);
  const signals = await store.getSignalsFor(founderId);
  const activeThesis =
    thesis ?? (await store.getThesis()) ?? defaultThesis();
  const history = await store.listScreenings(founderId);

  const { run_id } = startRun("vc");

  const first_pass = firstPassScreen({
    founder,
    product,
    thesis: activeThesis,
    requireDeck: founderId.startsWith("inbound_"),
  });
  await step(
    run_id,
    "first_pass",
    { founder_id: founderId },
    first_pass,
    first_pass.pass
      ? ["First-pass gate cleared"]
      : first_pass.reasons,
    store,
  );
  if (!first_pass.pass) {
    throw new Error(
      `First-pass failed: ${first_pass.reasons.join("; ")}. Fix materials before full analysis.`,
    );
  }

  await step(
    run_id,
    "load_signals",
    { founder_id: founderId },
    { signals: signals.length, sources: [...new Set(signals.map((s) => s.source))] },
    signals.map((s) => s.url ?? s.source),
    store,
  );

  // Multi-agent enrichment — scoped API endpoints per role (E2B / GH / Tavily / Firecrawl / SM / HN).
  let agents: AgentFleetResult | undefined;
  try {
    agents = await runAgentLanes({
      founder,
      product,
      claims: founder.claims,
    });
    for (const lane of agents.lanes) {
      for (const sp of lane.signal_payloads ?? []) {
        await store.addSignal({
          entity_type: "founder",
          entity_id: founderId,
          source: sp.source,
          url: sp.url,
          payload: sp.payload,
          observed_at: new Date().toISOString(),
        });
      }
    }
    await step(
      run_id,
      "agent_lanes",
      {
        roles: agents.lanes.map((l) => l.role),
        providers: agents.providers_used,
      },
      {
        ok_count: agents.ok_count,
        total_latency_ms: agents.total_latency_ms,
        sandboxes: agents.lanes
          .filter((l) => l.sandbox_id)
          .map((l) => ({ role: l.role, sandbox_id: l.sandbox_id })),
        lanes: agents.lanes.map((l) => ({
          role: l.role,
          ok: l.ok,
          providers: l.providers,
          evidence_n: l.evidence.length,
          error: l.error,
          latency_ms: l.latency_ms,
        })),
      },
      agents.lanes.flatMap((l) =>
        l.evidence.slice(0, 6).map((e) => `[${l.role}] ${e}`),
      ),
      store,
    );
  } catch (e) {
    await step(
      run_id,
      "agent_lanes",
      { founder_id: founderId },
      { ok: false },
      [e instanceof Error ? e.message : "agent lanes failed"],
      store,
    );
  }

  // Re-load signals after lane merges.
  const signalsAfter = await store.getSignalsFor(founderId);
  const gravity = scoreGravityFromSignals(signalsAfter);
  const sources = new Set(signalsAfter.map((s) => s.source)).size;
  const score = composeFounderScoreFromGravity(gravity, {
    coherence: coherenceFromSignals(sources),
    track_record: inferTrackRecord(founder),
  });

  await step(
    run_id,
    "distribution_gravity",
    { founder_id: founderId },
    {
      gravity: gravity.gravity_score,
      founder_score: score.founder_score,
      cold_start: score.cold_start,
      coherence: coherenceFromSignals(sources),
      signals: signalsAfter.length,
    },
    gravity.evidence,
    store,
  );

  const updated = await store.upsertFounder({
    ...founder,
    founder_score: score.founder_score,
    score_confidence: score.score_confidence,
    gravity,
  });

  const claimInputs = dedupeClaims([
    ...updated.claims,
    ...(product?.traction_claims ?? []),
  ]);
  const evaluated = evaluateClaims(claimInputs, signalsAfter, product);

  await step(
    run_id,
    "trust_claims",
    { count: claimInputs.length },
    {
      evaluated: evaluated.length,
      contradictions: evaluated.filter((c) => c.contradiction).length,
    },
    evaluated
      .filter((c) => c.contradiction)
      .map((c) => c.contradiction_note ?? c.text),
    store,
  );

  const validation = validateClaims(evaluated, signalsAfter, product);
  const claims = validation.validated;

  await step(
    run_id,
    "validator",
    { claims_in: evaluated.length },
    {
      validated: claims.length,
      corrected: validation.corrected,
      flags: validation.flags.length,
    },
    validation.flags.length
      ? validation.flags
      : ["No validator flags — claims consistent with observables"],
    store,
  );

  const screening = screenAxes({
    founder: updated,
    product,
    thesis: activeThesis,
    history,
    claims,
  });
  await store.saveScreening(screening);

  await step(
    run_id,
    "three_axis_screen",
    { axes: ["founder", "market", "idea"], averaged: false },
    {
      founder_axis: screening.founder_axis.score,
      market_axis: screening.market_axis.score,
      idea_axis: screening.idea_axis.score,
    },
    ["Three axes scored independently — never averaged"],
    store,
  );

  const memo = buildMemo({
    founder: updated,
    product,
    screening,
    thesis: activeThesis,
    claims,
  });
  await store.saveMemo(memo);

  await step(
    run_id,
    "memo_decision",
    { founder_id: founderId },
    {
      decision: memo.decision,
      decision_conf: memo.decision_conf,
      gaps: memo.gaps,
    },
    [`$100K decision: ${memo.decision}`, ...memo.gaps.slice(0, 3)],
    store,
  );

  return {
    run_id,
    founder: updated,
    product,
    screening,
    memo,
    claims,
    first_pass,
    validator: {
      flags: validation.flags,
      corrected: validation.corrected,
    },
    agents,
  };
}
