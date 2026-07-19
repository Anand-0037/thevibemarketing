import {
  discoverThenScrapeMarkdown,
  syncBrandMemory,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import {
  getMarketingStore,
  heuristicBrandFromUrl,
} from "@/lib/marketing-store";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const store = getMarketingStore();
  const brand = await store.getBrand();
  return NextResponse.json({ brand });
}

/**
 * POST { url } — Firecrawl map→markdown when keyed (cheap recon), else heuristic.
 * Never runs Firecrawl JSON extract here (wallet protection).
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = body.url?.trim();
    if (!url) {
      return NextResponse.json({ error: "url required" }, { status: 400 });
    }

    const disc = await discoverThenScrapeMarkdown(url);
    const draft = heuristicBrandFromUrl(disc.primaryUrl || url, disc.markdown);
    const store = getMarketingStore();
    const brand = await store.setBrand(draft);

    const memory = await syncBrandMemory({
      url: brand.url,
      name: brand.name,
      oneliner: brand.oneliner,
      icp: brand.icp,
      tone: brand.tone,
      pillars: brand.pillars,
      markdown: disc.markdown,
    });

    return NextResponse.json({
      brand,
      firecrawl: Boolean(disc.markdown),
      primaryUrl: disc.primaryUrl,
      mappedTargets: disc.targets.slice(0, 6),
      creditsHint: disc.creditsHint,
      supermemory: memory,
      note: [
        disc.markdown
          ? `Live Firecrawl map→markdown (${disc.creditsHint}).`
          : "No FIRECRAWL_API_KEY or scrape failed — heuristic brand from URL.",
        memory.factsOk
          ? `Supermemory synced (${memory.factCount} facts → ${memory.containerTag}).`
          : memory.error || "Supermemory not synced.",
      ].join(" "),
    });
  } catch (e) {
    const { reportError } = await import("@/lib/errors");
    await reportError("api/brand", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "brand extract failed" },
      { status: 500 },
    );
  }
}
