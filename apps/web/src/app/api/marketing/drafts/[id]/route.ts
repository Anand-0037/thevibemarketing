import { NextResponse } from "next/server";
import { getMarketingStore } from "@/lib/marketing-store";
import { withMarketingStore } from "@/lib/with-marketing";

export const runtime = "nodejs";

/** Alias approve/reject for older clients. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withMarketingStore(async () => {
    const { id } = await ctx.params;
    const body = (await req.json()) as {
      action?: "approve" | "reject" | "queue";
      note?: string;
      title?: string;
      body?: string;
    };

    const store = getMarketingStore();

    if (body.action === "approve") {
      const post = await store.approvePost(id);
      if (!post)
        return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ draft: post, post });
    }
    if (body.action === "reject") {
      const post = await store.rejectPost(id, body.note);
      if (!post)
        return NextResponse.json({ error: "not found" }, { status: 404 });
      return NextResponse.json({ draft: post, post });
    }
    if (body.action === "queue") {
      const post = await store.upsertPost({
        id,
        platform: "x",
        body: body.body || "",
        title: body.title,
        status: "pending",
      });
      return NextResponse.json({ draft: post, post });
    }

    if (body.title || body.body) {
      const existing = (await store.listPosts()).find((p) => p.id === id);
      const post = await store.upsertPost({
        id,
        platform: existing?.platform ?? "x",
        title: body.title ?? existing?.title ?? null,
        body: body.body ?? existing?.body ?? "",
      });
      return NextResponse.json({ draft: post, post });
    }

    return NextResponse.json({ error: "unknown action" }, { status: 400 });
  });
}
