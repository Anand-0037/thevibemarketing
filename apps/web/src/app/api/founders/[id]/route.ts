import { NextResponse } from "next/server";
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
    const founder = await store.getFounder(id);
    if (!founder) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    const product = await store.getProductForFounder(id);
    const signals = await store.getSignalsFor(id);
    const screening = await store.getLatestScreening(id);
    const memo = await store.getLatestMemo(id);
    return NextResponse.json({
      founder,
      product,
      signals,
      screening,
      memo,
    });
  });
}
