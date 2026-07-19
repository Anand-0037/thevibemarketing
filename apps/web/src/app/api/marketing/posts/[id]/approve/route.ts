import { NextResponse } from "next/server";
import { getMarketingStore } from "@/lib/marketing-store";
import { withMarketingStore } from "@/lib/with-marketing";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/** HITL approve → queue publish (live OAuth when account connected). */
export async function POST(_req: Request, { params }: Params) {
  return withMarketingStore(async () => {
    const { id } = await params;
    const store = getMarketingStore();
    const post = await store.approvePost(id);
    if (!post) {
      return NextResponse.json({ error: "post not found" }, { status: 404 });
    }
    const log = (await store.listPublishLog(5)).find((l) => l.post_id === post.id);
    return NextResponse.json({
      post,
      publish_log: log ?? null,
      note: "Approved — queued for publish. Connect the channel for live social API.",
    });
  });
}
