/**
 * Brand memory helpers — sync local BrandContext ↔ Supermemory container.
 */

import {
  addDocument,
  addMemories,
  brandContainerTag,
  getProfile,
  isSupermemoryConfigured,
  searchMemories,
  type SmProfileResult,
  type SmSearchResult,
} from "../connectors/supermemory";

export type BrandMemoryInput = {
  url: string;
  name: string;
  oneliner: string;
  icp: string;
  tone: string;
  pillars: string[];
  /** Optional Firecrawl markdown dump for deeper document ingest. */
  markdown?: string | null;
};

export type BrandSyncResult = {
  configured: boolean;
  containerTag: string;
  factsOk: boolean;
  documentOk: boolean;
  factCount: number;
  documentId?: string;
  error?: string;
};

export function containerForBrand(name: string): string {
  return brandContainerTag(name || "thevibemarketing");
}

export { isSupermemoryConfigured };

/** Push brand facts (+ optional scrape markdown) into Supermemory. */
export async function syncBrandMemory(
  brand: BrandMemoryInput,
): Promise<BrandSyncResult> {
  const containerTag = containerForBrand(brand.name);
  if (!isSupermemoryConfigured()) {
    return {
      configured: false,
      containerTag,
      factsOk: false,
      documentOk: false,
      factCount: 0,
      error: "SUPERMEMORY_API_KEY unset — local brand store only",
    };
  }

  const pillars = brand.pillars.filter(Boolean).join(", ") || "distribution";
  const facts = [
    `Brand name: ${brand.name}. One-liner: ${brand.oneliner}`,
    `ICP: ${brand.icp}. Tone/voice: ${brand.tone}. Never write off-brand.`,
    `Content pillars: ${pillars}. Site: ${brand.url}`,
    `${brand.name} is marketed by an autonomous agent fleet with HITL autonomy dial (L1 default).`,
  ];

  const mem = await addMemories({
    contents: facts,
    containerTag,
    metadata: {
      source: "brand_sync",
      kind: "brand_voice",
      brand: brand.name,
    },
    isStatic: true,
  });

  let documentOk = false;
  let documentId: string | undefined;
  if (brand.markdown && brand.markdown.trim().length > 80) {
    const doc = await addDocument({
      content: brand.markdown.slice(0, 24_000),
      containerTag,
      customId: `brand_md_${brand.name.toLowerCase().replace(/\s+/g, "_").slice(0, 40)}`,
      metadata: { source: "firecrawl", kind: "brand_site" },
    });
    documentOk = doc.ok;
    documentId = doc.documentId || doc.id;
  }

  return {
    configured: true,
    containerTag,
    factsOk: mem.ok,
    documentOk,
    factCount: mem.memories?.length ?? 0,
    documentId,
    error: mem.ok ? undefined : mem.error,
  };
}

/** Recall brand context for draft generation / agent prompts. */
export async function recallBrandMemory(opts: {
  brandName: string;
  q?: string;
}): Promise<{
  configured: boolean;
  containerTag: string;
  profile: SmProfileResult;
  search: SmSearchResult;
  /** Flattened lines safe to inject into draft templates / prompts. */
  contextLines: string[];
}> {
  const containerTag = containerForBrand(opts.brandName);
  const q = opts.q?.trim() || "brand tone voice ICP pillars positioning";

  if (!isSupermemoryConfigured()) {
    return {
      configured: false,
      containerTag,
      profile: {
        ok: false,
        staticFacts: [],
        dynamicFacts: [],
        searchHits: [],
        offline: true,
      },
      search: {
        ok: false,
        hits: [],
        total: 0,
        offline: true,
      },
      contextLines: [],
    };
  }

  const [profile, search] = await Promise.all([
    getProfile({ containerTag, q }),
    searchMemories({ q, containerTag, limit: 6, searchMode: "hybrid" }),
  ]);

  const contextLines = [
    ...profile.staticFacts,
    ...profile.dynamicFacts,
    ...search.hits.map((h) => h.text),
  ]
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 12);

  return { configured: true, containerTag, profile, search, contextLines };
}
