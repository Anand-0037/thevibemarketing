import {
  composeFounderScoreFromGravity,
  evaluateConviction,
  formatFunnelClock,
  hoursInFunnel,
  inferTrackRecord,
  momentumDelta,
  scoreHistoryTrend,
  softSkillBands,
  thesisFit,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import { withOwnedStore } from "@/lib/with-store";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(req: Request) {
  return withOwnedStore(async () => {

    const store = getStore();
    const thesis = await store.getThesis();
    const url = new URL(req.url);
    const hideMiss = url.searchParams.get("hide_miss") === "1";
    const sort = url.searchParams.get("sort") || "score"; // score | momentum

    const founders = await store.listFounders();

    const data = await Promise.all(
      founders.map(async (f) => {
        const product = await store.getProductForFounder(f.id);
        const screening = await store.getLatestScreening(f.id);
        const memo = await store.getLatestMemo(f.id);
        const signals = await store.getSignalsFor(f.id);
        const fit = thesisFit(thesis, product, f);
        const history = f.score_history ?? [];
        const momentum = momentumDelta(history);
        const fs_trend = scoreHistoryTrend(history);
        const hours = hoursInFunnel(f.created_at);
        const conviction = evaluateConviction({
          founder: f,
          product,
          thesis,
          alreadyScreened: Boolean(screening),
        });
        const sourceCount = new Set(signals.map((s) => s.source)).size;
        const trait_bands = softSkillBands({
          gravity: f.gravity,
          founder_score: f.founder_score,
          signal_source_count: sourceCount,
        });
        const contradictions = (f.claims ?? []).filter((c) => c.contradiction)
          .length;
        const cold_start = composeFounderScoreFromGravity(f.gravity, {
          track_record: inferTrackRecord(f),
          coherence: sourceCount >= 2 ? 70 : 45,
        }).cold_start;
        return {
          ...f,
          product,
          screening: screening
            ? {
                founder_axis: screening.founder_axis,
                market_axis: screening.market_axis,
                idea_axis: screening.idea_axis,
                scored_at: screening.scored_at,
              }
            : null,
          memo_decision: memo?.decision ?? null,
          memo_decision_conf: memo?.decision_conf ?? null,
          claim_contradictions: contradictions,
          thesis_fit: fit.fit,
          thesis_note: fit.note,
          momentum,
          fs_trend,
          activation_status: f.activation?.status ?? "none",
          hours_in_funnel: hours,
          funnel_clock: formatFunnelClock(hours),
          within_24h: hours <= 24,
          conviction_crossed: conviction.crossed,
          conviction_score: conviction.score,
          conviction_reasons: conviction.reasons,
          trait_bands,
          cold_start,
        };
      }),
    );

    let rows = data;
    if (hideMiss) rows = rows.filter((r) => r.thesis_fit !== "miss");

    if (sort === "momentum") {
      rows = [...rows].sort((a, b) => b.momentum - a.momentum || b.founder_score - a.founder_score);
    } else {
      // Soft thesis ranking: match > partial > miss, then score
      const rank = { match: 0, partial: 1, miss: 2 } as const;
      rows = [...rows].sort((a, b) => {
        const tr = rank[a.thesis_fit] - rank[b.thesis_fit];
        if (tr !== 0) return tr;
        return b.founder_score - a.founder_score;
      });
    }

    return NextResponse.json({ founders: rows, thesis });
  });
}
