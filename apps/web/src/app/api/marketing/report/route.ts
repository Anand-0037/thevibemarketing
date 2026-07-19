import { NextResponse } from "next/server";
import { getMarketingStore } from "@/lib/marketing-store";

export const runtime = "nodejs";

/** LEARN step — weekly rollup from marketing store (no fake analytics). */
export async function GET() {
  const store = getMarketingStore();
  const [posts, loops, publishLog, autonomy, brand] = await Promise.all([
    store.listPosts(),
    store.listLoops(),
    store.listPublishLog(100),
    store.getAutonomy(),
    store.getBrand(),
  ]);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const inWeek = (iso: string) => new Date(iso).getTime() >= weekAgo;

  const postsWeek = posts.filter((p) => inWeek(p.created_at));
  const byStatus = {
    pending: postsWeek.filter((p) => p.status === "pending").length,
    approved: postsWeek.filter((p) => p.status === "approved").length,
    rejected: postsWeek.filter((p) => p.status === "rejected").length,
    published: postsWeek.filter((p) => p.status === "published").length,
  };
  const byPlatform: Record<string, number> = {};
  for (const p of postsWeek) {
    byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1;
  }

  const loopsWeek = loops.filter((l) => inWeek(l.started_at));
  const pubsWeek = publishLog.filter((l) => inWeek(l.at));

  const tip =
    byStatus.pending > byStatus.published
      ? "HITL queue is backing up — clear pending or raise autonomy for low-risk channels."
      : pubsWeek.length === 0
        ? "No queued publishes this week — run a Studio loop, then approve or set L2/L3."
        : "Fleet is shipping drafts. Review publish_log — live social needs a connected account.";

  return NextResponse.json({
    ok: true,
    window: "7d",
    brand: brand?.name ?? null,
    autonomy,
    posts: {
      total_all_time: posts.length,
      created_7d: postsWeek.length,
      by_status: byStatus,
      by_platform: byPlatform,
    },
    loops: {
      runs_7d: loopsWeek.length,
      done: loopsWeek.filter((l) => l.status === "done").length,
      failed: loopsWeek.filter((l) => l.status === "failed").length,
    },
    publish: {
      stub_acts_7d: pubsWeek.length,
      via: {
        hitl: pubsWeek.filter((l) => l.via === "hitl_approve").length,
        l2: pubsWeek.filter((l) => l.via === "l2_auto").length,
        l3: pubsWeek.filter((l) => l.via === "l3_auto").length,
      },
      recent: pubsWeek.slice(0, 10),
    },
    tip,
    honest: "No third-party analytics — counts from local marketing.json only.",
  });
}
