import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getMarketingStore,
  type CampaignBrief,
  type CampaignDay,
} from "@/lib/marketing-store";

export const runtime = "nodejs";

function buildCampaign(brand: {
  name: string;
  oneliner: string;
  icp: string;
  pillars: string[];
}): CampaignBrief {
  const pillar = (i: number) =>
    brand.pillars[i % brand.pillars.length] ?? "distribution";

  const days: CampaignDay[] = [
    {
      day: 1,
      channel: "linkedin",
      goal: "Position the brand for your ICP",
      draft_hint: `LinkedIn: why ${brand.name} exists — ${brand.oneliner}. Pillar: ${pillar(0)}.`,
    },
    {
      day: 2,
      channel: "x",
      goal: "Short proof / founder voice",
      draft_hint: `X: one concrete problem for ${brand.icp} + soft CTA.`,
    },
    {
      day: 3,
      channel: "reddit",
      goal: "Helpful community post (not salesy)",
      draft_hint: `Reddit: ask a real question or share a lesson on ${pillar(1)} — mention ${brand.name} only if useful.`,
    },
    {
      day: 4,
      channel: "linkedin",
      goal: "Pillar deep-dive",
      draft_hint: `LinkedIn: ${pillar(2)} for ${brand.icp} — 2–3 short paragraphs.`,
    },
    {
      day: 5,
      channel: "x",
      goal: "Thread / tip stack",
      draft_hint: `X thread: 3 tips ${brand.icp} can use this week — product as helper, not hero.`,
    },
    {
      day: 6,
      channel: "email",
      goal: "Owned list note (if you have subscribers)",
      draft_hint: "Newsletter: one story + one CTA. Same voice; still HITL before send.",
    },
    {
      day: 7,
      channel: "blog",
      goal: "Longer asset that social can cite next week",
      draft_hint: `Blog outline: ${pillar(0)} for ${brand.icp} — clip to X/LinkedIn/Reddit later.`,
    },
  ];

  return {
    id: `camp_${randomUUID().slice(0, 8)}`,
    title: `7-day campaign · ${brand.name}`,
    created_at: new Date().toISOString(),
    audience: brand.icp,
    days,
    note: "Planning artifact only. Studio drafts still need HITL → queued until a connected channel returns a post ID. Google Business Profile posts are coming soon — not wired yet.",
  };
}

export async function GET() {
  const store = getMarketingStore();
  const campaign = await store.getCampaign();
  return NextResponse.json({ campaign });
}

export async function POST() {
  const store = getMarketingStore();
  let brand = await store.getBrand();
  if (!brand) {
    brand = await store.setBrand({
      url: "https://vibemarketer.fun",
      name: "thevibemarketing",
      oneliner:
        "Autonomous AI agent fleet for marketing — drafts for SaaS, startups, and MSMEs.",
      icp: "SaaS founders, early startups, and MSMEs who need on-brand social without an agency",
      tone: "direct/technical",
      pillars: [
        "distribution",
        "HITL brand safety",
        "persistent brand memory",
      ],
    });
  }

  const campaign = buildCampaign(brand);
  await store.setCampaign(campaign);
  await store.addLoop({
    id: `loop_${randomUUID().slice(0, 8)}`,
    name: "campaign-brief",
    started_at: campaign.created_at,
    finished_at: campaign.created_at,
    status: "done",
    posts_created: 0,
    note: "7-day campaign brief saved — generate drafts separately",
  });

  return NextResponse.json({ campaign, brand });
}
