import {
  composeFounderScoreFromGravity,
  evaluateConviction,
  formatFunnelClock,
  hoursInFunnel,
  inferTrackRecord,
  softSkillBands,
  thesisFit,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import { resolveFounder } from "@/lib/resolve-founder";
import { withOwnedStore } from "@/lib/with-store";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withOwnedStore(async () => {

    const { id } = await ctx.params;
    const store = getStore();
    const founder = await resolveFounder(store, id);
    if (!founder) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const founderId = founder.id;
    const product = await store.getProductForFounder(founderId);
    const signals = await store.getSignalsFor(founderId);
    const screening = await store.getLatestScreening(founderId);
    const memo = await store.getLatestMemo(founderId);
    const thesis = await store.getThesis();
    const hours = hoursInFunnel(founder.created_at);
    const conviction = evaluateConviction({
      founder,
      product,
      thesis,
      alreadyScreened: Boolean(screening),
    });
    const sourceCount = new Set(signals.map((s) => s.source)).size;
    const trait_bands = softSkillBands({
      gravity: founder.gravity,
      founder_score: founder.founder_score,
      signal_source_count: sourceCount,
    });
    const fit = thesisFit(thesis, product, founder);
    const cold_start = composeFounderScoreFromGravity(founder.gravity, {
      track_record: inferTrackRecord(founder),
      coherence: sourceCount >= 2 ? 70 : 45,
    }).cold_start;
    return NextResponse.json({
      founder,
      product,
      signals,
      screening,
      memo,
      thesis_fit: fit.fit,
      thesis_note: fit.note,
      hours_in_funnel: hours,
      funnel_clock: formatFunnelClock(hours),
      within_24h: hours <= 24,
      conviction,
      trait_bands,
      cold_start,
      canonical_id: founderId,
    });
  });
}
