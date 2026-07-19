import { NextResponse } from "next/server";
import { withOwnedStore } from "@/lib/with-store";
import { runVcBrainPipeline } from "@/lib/pipeline";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

/** POST /api/screen — batch screen all founders (or body.ids). */
export async function POST(req: Request) {
  return withOwnedStore(async () => {

    const store = getStore();
    let ids: string[] | undefined;
    try {
      const body = (await req.json()) as { ids?: string[] };
      if (Array.isArray(body.ids) && body.ids.length) ids = body.ids;
    } catch {
      /* empty body ok */
    }

    const founders = await store.listFounders();
    const targets = ids
      ? founders.filter((f) => ids!.includes(f.id))
      : founders;

    if (targets.length === 0) {
      return NextResponse.json(
        { error: "No founders to screen. Seed or ingest first." },
        { status: 400 },
      );
    }

    const results: Array<{
      id: string;
      name: string;
      run_id: string;
      decision: string;
      decision_conf: number;
      founder_axis: number;
      market_axis: number;
      idea_axis: number;
      error?: string;
    }> = [];

    for (const f of targets) {
      try {
        const r = await runVcBrainPipeline(store, f.id);
        results.push({
          id: f.id,
          name: f.name,
          run_id: r.run_id,
          decision: r.memo.decision,
          decision_conf: r.memo.decision_conf,
          founder_axis: r.screening.founder_axis.score,
          market_axis: r.screening.market_axis.score,
          idea_axis: r.screening.idea_axis.score,
        });
      } catch (e) {
        results.push({
          id: f.id,
          name: f.name,
          run_id: "",
          decision: "error",
          decision_conf: 0,
          founder_axis: 0,
          market_axis: 0,
          idea_axis: 0,
          error: e instanceof Error ? e.message : "screen failed",
        });
      }
    }

    const failed = results.filter((r) => r.error).length;
    const ok = failed === 0;

    return NextResponse.json({
      ok,
      partial: failed > 0 && failed < results.length,
      count: results.length,
      failed,
      results,
    });
  });
}
