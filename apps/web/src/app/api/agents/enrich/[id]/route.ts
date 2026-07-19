import { runAgentLanes } from "@vibe/engine";
import { NextResponse } from "next/server";
import { withOwnedStore } from "@/lib/with-store";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Run agent lanes for a founder without full screen (debug / re-enrich). */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withOwnedStore(async () => {

    const { id } = await ctx.params;
    const store = getStore();
    const founder = await store.getFounder(id);
    if (!founder) {
      return NextResponse.json({ error: "founder not found" }, { status: 404 });
    }
    const product = await store.getProductForFounder(id);
    const fleet = await runAgentLanes({
      founder,
      product,
      claims: founder.claims,
    });

    for (const lane of fleet.lanes) {
      for (const sp of lane.signal_payloads ?? []) {
        await store.addSignal({
          entity_type: "founder",
          entity_id: id,
          source: sp.source,
          url: sp.url,
          payload: sp.payload,
          observed_at: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ ok: true, founder_id: id, ...fleet });
  });
}
