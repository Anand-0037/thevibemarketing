import {
  momentumDelta,
  scoreHistoryTrend,
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

    let founders = await store.listFounders();

    const data = await Promise.all(
      founders.map(async (f) => {
        const product = await store.getProductForFounder(f.id);
        const screening = await store.getLatestScreening(f.id);
        const fit = thesisFit(thesis, product, f);
        const history = f.score_history ?? [];
        const momentum = momentumDelta(history);
        const fs_trend = scoreHistoryTrend(history);
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
          thesis_fit: fit.fit,
          thesis_note: fit.note,
          momentum,
          fs_trend,
          activation_status: f.activation?.status ?? "none",
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
