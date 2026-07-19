import { NextResponse } from "next/server";
import { getMarketingStore } from "@/lib/marketing-store";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const { id } = await params;
  let note: string | undefined;
  try {
    const body = (await req.json()) as { note?: string };
    if (body.note) note = String(body.note);
  } catch {
    /* empty body ok */
  }

  const store = getMarketingStore();
  const post = await store.rejectPost(id, note);
  if (!post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}
