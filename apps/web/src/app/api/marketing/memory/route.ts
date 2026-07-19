import {
  isSupermemoryConfigured,
  recallBrandMemory,
  syncBrandMemory,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import { getMarketingStore } from "@/lib/marketing-store";

export const runtime = "nodejs";
export const maxDuration = 45;

/** GET — status + optional recall (?q=) for current brand. */
export async function GET(req: Request) {
  const store = getMarketingStore();
  const brand = await store.getBrand();
  const configured = isSupermemoryConfigured();
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || undefined;

  if (!brand) {
    return NextResponse.json({
      configured,
      brand: null,
      note: "No local brand yet — run onboarding first.",
    });
  }

  const recall = await recallBrandMemory({ brandName: brand.name, q });
  return NextResponse.json({
    configured,
    brand: { name: brand.name, url: brand.url },
    containerTag: recall.containerTag,
    contextLines: recall.contextLines,
    staticFacts: recall.profile.staticFacts,
    dynamicFacts: recall.profile.dynamicFacts,
    hits: recall.search.hits,
    live: recall.configured && recall.contextLines.length > 0,
    note: !configured
      ? "SUPERMEMORY_API_KEY unset — local brand store only"
      : recall.contextLines.length
        ? "Live Supermemory recall"
        : "Key set but no memories yet — sync from onboarding or POST /api/marketing/memory",
  });
}

/** POST — sync current local brand (optional markdown) into Supermemory. */
export async function POST(req: Request) {
  const store = getMarketingStore();
  let body: { markdown?: string; q?: string } = {};
  try {
    body = (await req.json()) as { markdown?: string; q?: string };
  } catch {
    body = {};
  }

  const brand = await store.getBrand();
  if (!brand) {
    return NextResponse.json(
      { error: "No brand in local store — complete onboarding first" },
      { status: 400 },
    );
  }

  const sync = await syncBrandMemory({
    url: brand.url,
    name: brand.name,
    oneliner: brand.oneliner,
    icp: brand.icp,
    tone: brand.tone,
    pillars: brand.pillars,
    markdown: body.markdown,
  });

  const recall = await recallBrandMemory({
    brandName: brand.name,
    q: body.q || "brand tone ICP",
  });

  return NextResponse.json({
    sync,
    recall: {
      containerTag: recall.containerTag,
      contextLines: recall.contextLines,
      hitCount: recall.search.hits.length,
    },
    live: sync.factsOk,
  });
}
