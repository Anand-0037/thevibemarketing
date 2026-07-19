import { randomUUID } from "node:crypto";
import { fetchShowHn } from "@vibe/engine";
import { NextResponse } from "next/server";
import {
  getMarketingStore,
  isLowRiskPlatform,
  L3_BLOCKED_NOTE,
  type BrandContext,
  type LoopType,
  type Platform,
  type Post,
  type PostStatus,
} from "@/lib/marketing-store";
import { withMarketingStore } from "@/lib/with-marketing";

export const runtime = "nodejs";

const LOOP_TYPES = new Set<LoopType>(["daily_distribution", "opportunity"]);

type DraftTemplate = {
  platform: Platform;
  title: string | null;
  body: string;
  rationale: string;
  note?: string;
  sensed_url?: string;
};

function dailyTemplates(brand: Omit<BrandContext, "updated_at">): DraftTemplate[] {
  const pillar = brand.pillars[0] ?? "distribution";
  const pillar2 = brand.pillars[1] ?? pillar;
  return [
    {
      platform: "x",
      title: null,
      body: `${brand.oneliner}\n\nFor ${brand.icp}.\nPillar: ${pillar}.\n\n${brand.url}`,
      rationale: `Daily Distribution Loop — X template (${brand.name}).`,
    },
    {
      platform: "linkedin",
      title: `${brand.name}: today's distribution beat`,
      body: `Shipping product is the easy part. Distribution is the job.\n\n${brand.name}: ${brand.oneliner}\n\nICP: ${brand.icp}. Voice: ${brand.tone}.\nToday's beat leans on ${pillar} (+ ${pillar2}).\n\nDraft only — still needs HITL approval before publish.\n\n${brand.url}`,
      rationale: `Daily Distribution Loop — LinkedIn template (${brand.name}).`,
    },
    {
      platform: "reddit",
      title: `How are solo founders handling distribution this week?`,
      body: `Curious what channels actually move the needle for early SaaS.\n\nWe're dogfooding ${brand.name} (${brand.url}) — ${brand.oneliner}\n\nICP we care about: ${brand.icp}. Our content pillars start with ${pillar}.\n\nNot selling in the thread — genuinely want the war stories.`,
      rationale: `Daily Distribution Loop — Reddit template (${brand.name}).`,
    },
  ];
}

async function opportunityFromSense(
  brand: Omit<BrandContext, "updated_at">,
): Promise<{ drafts: DraftTemplate[]; sensed: number; note: string }> {
  const pillar = brand.pillars[0] ?? "distribution";
  const risk =
    "HIGHER RISK: community reply drafts can read as spam if tone misses. Review carefully before approve.";

  let hnItems: Awaited<ReturnType<typeof fetchShowHn>> = [];
  try {
    hnItems = await fetchShowHn(5);
  } catch {
    hnItems = [];
  }

  const drafts: DraftTemplate[] = [];

  for (const item of hnItems.slice(0, 2)) {
    drafts.push({
      platform: "reddit",
      title: `[HN reply draft] ${item.title.slice(0, 72)}`,
      body: `HN-style reply draft (do not post as-is) — sensed from live Show HN:\nSource: ${item.url}\n\n---\nInteresting thread on "${item.title}".\n\nOur constraint was brand drift when we tried full auto. We keep persistent brand context (ICP, tone, pillars like "${pillar}") and only auto-draft. Humans still approve.\n\nProduct: ${brand.name} — ${brand.oneliner} (${brand.url}). Happy to take punches on the approach.\n---`,
      rationale: `Opportunity Loop — SENSE via Show HN (${item.external_id}).`,
      note: risk,
      sensed_url: item.url,
    });
  }

  // Always include one Reddit opportunity stub + optional X if HN thin
  drafts.push({
    platform: "reddit",
    title: `[Reply draft] r/SaaS — "How do you do marketing with no marketer?"`,
    body: `Reply draft (do not post as-is):\n\n---\nBeen in that boat. We treat marketing like an engineering loop: brand memory → draft → human gate → publish.\n\n${brand.name} is our dogfood for that (${brand.url}) — ${brand.oneliner}\n\nNot a silver bullet, but locking autonomy so nothing ships without eyes has saved us more than once.\n---`,
    rationale: `Opportunity Loop — Reddit reply framing (${brand.name}).`,
    note: risk,
  });

  if (drafts.length < 3) {
    drafts.push({
      platform: "x",
      title: null,
      body: `Opportunity draft (quote-tweet / reply style):\n\nSaw another "AI will replace your marketing team" take.\n\nReplacement isn't the point. Persistent brand memory + a human gate is.\n\n${brand.name}: ${brand.oneliner}\n${brand.url}`,
      rationale: `Opportunity Loop — X reply-style (${brand.name}).`,
      note: risk,
    });
  }

  return {
    drafts: drafts.slice(0, 3),
    sensed: hnItems.length,
    note:
      hnItems.length > 0
        ? `SENSE: ${hnItems.length} Show HN items; drafted replies citing real URLs.`
        : "SENSE: HN unreachable — fell back to opportunity stubs.",
  };
}

function resolveInitialStatus(
  autonomy: "L1" | "L2" | "L3",
  platform: Platform,
  loopType: "daily_distribution" | "opportunity",
): { status: PostStatus; autoPublish: boolean } {
  if (autonomy === "L3") {
    return { status: "pending", autoPublish: false };
  }
  if (autonomy === "L2" && loopType === "daily_distribution" && isLowRiskPlatform(platform)) {
    // Queue only — never claim published without a provider post ID/URL.
    return { status: "queued", autoPublish: true };
  }
  return { status: "pending", autoPublish: false };
}

export async function POST(req: Request) {
  return withMarketingStore(async () => {
  let body: { type?: string };
  try {
    body = (await req.json()) as { type?: string };
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const type = body.type;
  if (!type || !LOOP_TYPES.has(type as LoopType)) {
    return NextResponse.json(
      {
        error: 'type must be "daily_distribution" or "opportunity"',
      },
      { status: 400 },
    );
  }
  const loopType = type as "daily_distribution" | "opportunity";

  const store = getMarketingStore();
  const brand = await store.getBrand();
  if (!brand) {
    return NextResponse.json(
      {
        error:
          "Set your brand first (onboarding or Brand URL) before running a loop.",
      },
      { status: 400 },
    );
  }

  const autonomy = await store.getAutonomy();
  const startedAt = new Date().toISOString();
  const loopId = `loop_${randomUUID().slice(0, 8)}`;

  let senseNote = "";
  let selected: DraftTemplate[] = [];
  let source: "template" | "sense+template" = "template";

  if (loopType === "opportunity") {
    const sensed = await opportunityFromSense(brand);
    selected = sensed.drafts;
    senseNote = sensed.note;
    source = sensed.sensed > 0 ? "sense+template" : "template";
  } else {
    selected = dailyTemplates(brand).slice(0, 3);
  }

  let loop = await store.addLoop({
    id: loopId,
    name: loopType,
    started_at: startedAt,
    status: "running",
    note:
      loopType === "opportunity"
        ? senseNote
        : `Daily drafts · autonomy ${autonomy}`,
  });

  const created: Post[] = [];
  const brandSlug = brand.name.toLowerCase().replace(/\s+/g, "");
  let autoPublished = 0;

  try {
    for (const d of selected) {
      const { status, autoPublish } = resolveInitialStatus(
        autonomy,
        d.platform,
        loopType,
      );
      const postId = `mp_${loopType.slice(0, 4)}_${randomUUID().slice(0, 8)}`;
      let post = await store.upsertPost({
        id: postId,
        platform: d.platform,
        title: d.title,
        body: d.body,
        status: autoPublish ? "pending" : status,
        autonomy,
        rationale: d.rationale,
        note:
          [
            d.note
              ? d.sensed_url
                ? `${d.note} Source: ${d.sensed_url}`
                : d.note
              : d.sensed_url,
            autonomy === "L3" ? L3_BLOCKED_NOTE : undefined,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
        brand: brandSlug,
      });

      if (autoPublish) {
        const via = autonomy === "L3" ? "l3_auto" : "l2_auto";
        post = (await store.publishPost(post.id, via)) ?? post;
        autoPublished += 1;
      }

      created.push(post);
    }

    loop =
      (await store.updateLoop(loopId, {
        status: "done",
        finished_at: new Date().toISOString(),
        posts_created: created.length,
        note: [
          loop.note,
          autoPublished
            ? `${autoPublished} auto-published under ${autonomy}`
            : `${created.length} pending HITL`,
        ]
          .filter(Boolean)
          .join(" · "),
      })) ?? loop;

    return NextResponse.json({
      loop,
      posts: created,
      source,
      autonomy,
      auto_published: autoPublished,
      stub_act: true,
    });
  } catch (err) {
    await store.updateLoop(loopId, {
      status: "failed",
      finished_at: new Date().toISOString(),
      note: err instanceof Error ? err.message : "Loop failed",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Loop failed" },
      { status: 500 },
    );
  }
  });
}
