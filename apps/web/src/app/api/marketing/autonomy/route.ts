import { NextResponse } from "next/server";
import {
  getMarketingStore,
  type AutonomyLevel,
} from "@/lib/marketing-store";

export const runtime = "nodejs";

const LEVELS = new Set<AutonomyLevel>(["L1", "L2", "L3"]);

const NOTES: Record<AutonomyLevel, string> = {
  L1: "All drafts pending HITL. Approve queues publish (needs connected account).",
  L2: "Low-risk (X/LinkedIn daily) auto-queue when connected. Reddit/opportunity stay pending.",
  L3: "All new drafts auto-queue when connected. HITL still available.",
};

export async function GET() {
  const store = getMarketingStore();
  const autonomy = await store.getAutonomy();
  return NextResponse.json({
    autonomy,
    note: NOTES[autonomy],
  });
}

export async function POST(req: Request) {
  let body: { autonomy?: string };
  try {
    body = (await req.json()) as { autonomy?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!body.autonomy || !LEVELS.has(body.autonomy as AutonomyLevel)) {
    return NextResponse.json(
      { error: 'autonomy must be "L1", "L2", or "L3"' },
      { status: 400 },
    );
  }
  const store = getMarketingStore();
  const autonomy = await store.setAutonomy(body.autonomy as AutonomyLevel);
  return NextResponse.json({
    autonomy,
    note: NOTES[autonomy],
  });
}
