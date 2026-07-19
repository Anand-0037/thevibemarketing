import { NextResponse } from "next/server";
import {
  getMarketingStore,
  type Platform,
  type PostStatus,
} from "@/lib/marketing-store";

export const runtime = "nodejs";

const PLATFORMS = new Set<Platform>(["x", "linkedin", "reddit"]);

/** Alias of /api/marketing/posts for older clients. */
export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status") as PostStatus | null;
  const store = getMarketingStore();
  const posts = await store.listPosts(status || undefined);
  return NextResponse.json({ drafts: posts, posts });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      channel?: string;
      platform?: string;
      title?: string;
      body?: string;
    };
    const platform = (body.platform || body.channel) as Platform | undefined;
    if (!platform || !PLATFORMS.has(platform) || !body.body) {
      return NextResponse.json(
        { error: "platform/channel (x|linkedin|reddit) and body required" },
        { status: 400 },
      );
    }
    const store = getMarketingStore();
    const post = await store.upsertPost({
      platform,
      title: body.title ?? null,
      body: body.body,
      status: "pending",
      autonomy: "L1",
    });
    return NextResponse.json({ draft: post, post });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 },
    );
  }
}
