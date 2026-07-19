import { NextResponse } from "next/server";
import { withOwnedStore } from "@/lib/with-store";

/** Auth + owner-scoped marketing store for fleet APIs. */
export async function withMarketingStore(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    const result = await withOwnedStore(async () => handler());
    return result;
  } catch (e) {
    console.error("[marketing]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Marketing API failed" },
      { status: 500 },
    );
  }
}
