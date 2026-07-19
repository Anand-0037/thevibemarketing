import { syncBrandMemory } from "@vibe/engine";
import { NextResponse } from "next/server";
import { getMarketingStore, type BrandContext } from "@/lib/marketing-store";
import { normalizeHttpUrl } from "@/lib/url";
import { withMarketingStore } from "@/lib/with-marketing";

export const runtime = "nodejs";
export const maxDuration = 45;

export async function GET() {
  return withMarketingStore(async () => {
    const store = getMarketingStore();
    const brand = await store.getBrand();
    return NextResponse.json({ brand });
  });
}

export async function POST(req: Request) {
  return withMarketingStore(async () => {
    const body = (await req.json()) as Partial<BrandContext>;
    const url = normalizeHttpUrl(String(body.url || ""));
    if (!url || !body.name) {
      return NextResponse.json(
        { error: "url and name are required (bare domains OK, e.g. kaggleingest.com)" },
        { status: 400 },
      );
    }

    const store = getMarketingStore();
    const brand = await store.setBrand({
      url,
      name: String(body.name),
      oneliner: String(body.oneliner ?? ""),
      icp: String(body.icp ?? "solo SaaS founders"),
      tone: String(body.tone ?? "direct/technical"),
      pillars: Array.isArray(body.pillars)
        ? body.pillars.map(String)
        : ["distribution", "HITL brand safety", "persistent memory"],
    });

    const supermemory = await syncBrandMemory({
      url: brand.url,
      name: brand.name,
      oneliner: brand.oneliner,
      icp: brand.icp,
      tone: brand.tone,
      pillars: brand.pillars,
    });

    return NextResponse.json({ brand, supermemory });
  });
}
