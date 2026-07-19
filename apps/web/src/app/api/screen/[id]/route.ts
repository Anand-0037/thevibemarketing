import { NextResponse } from "next/server";
import { withOwnedStore } from "@/lib/with-store";
import { runVcBrainPipeline } from "@/lib/pipeline";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
/** Deep research + agent lanes need headroom on Vercel. */
export const maxDuration = 120;

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withOwnedStore(async () => {

    const { id } = await ctx.params;
    const store = getStore();
    try {
      const result = await runVcBrainPipeline(store, id);
      return NextResponse.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : "screen failed";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  });
}
