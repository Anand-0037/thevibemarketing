import { NextResponse } from "next/server";
import { getMarketingStore } from "@/lib/marketing-store";

export const runtime = "nodejs";

export async function GET() {
  const store = getMarketingStore();
  const loops = await store.listLoops();
  return NextResponse.json({ loops });
}
