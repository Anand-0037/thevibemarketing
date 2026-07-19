import { runAgentLanes } from "@vibe/engine";
import { NextResponse } from "next/server";
import { resolveFounder } from "@/lib/resolve-founder";
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
    const founder = await resolveFounder(store, id);
    if (!founder) {
      return NextResponse.json({ error: "founder not found" }, { status: 404 });
    }
    const founderId = founder.id;
    const product = await store.getProductForFounder(founderId);
    const fleet = await runAgentLanes({
      founder,
      product,
      claims: founder.claims,
    });

    for (const lane of fleet.lanes) {
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

    return NextResponse.json({ ok: true, founder_id: founderId, ...fleet });
  });
}
