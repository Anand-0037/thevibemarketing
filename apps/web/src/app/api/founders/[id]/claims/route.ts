import { NextResponse } from "next/server";
import { withOwnedStore } from "@/lib/with-store";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";

/**
 * Attach a traction claim for Diligence / Trust scoring.
 * Body: { text: string, evidence_url?: string, probe?: boolean }
 *
 * probe=true inserts a clearly labeled overstated claim so the Trust
 * contradiction path is demonstrable on any live founder —
 * without fabricating people.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return withOwnedStore(async () => {
    const { id } = await ctx.params;
    const store = getStore();
    const founder = await store.getFounder(id);
    if (!founder) {
      return NextResponse.json({ error: "Founder not found" }, { status: 404 });
    }

    let body: {
      text?: string;
      evidence_url?: string;
      probe?: boolean;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const probe = Boolean(body.probe);
    const text = probe
      ? "Diligence probe: we have 50,000 users and $25k MRR"
      : (body.text?.trim() ?? "");

    if (!text) {
      return NextResponse.json(
        { error: "text required (or probe=true)" },
        { status: 400 },
      );
    }

    // Probe needs a public evidence_url so url_diligence runs in the pipeline
    // (Firecrawl + verify). Prefer a live GitHub/HN signal; fall back to example.com.
    let evidenceUrl = body.evidence_url?.trim() || undefined;
    if (probe && !evidenceUrl) {
      const signals = await store.getSignalsFor(id);
      const publicSignal = signals.find((s) =>
        /^https?:\/\//i.test(s.url ?? ""),
      );
      evidenceUrl =
        publicSignal?.url ??
        founder.links?.find((l) => /^https?:\/\//i.test(l)) ??
        "https://example.com";
    }

    const claim = {
      text,
      category: "traction" as const,
      evidence_url: evidenceUrl,
      confidence: probe ? 0.4 : 0.55,
      contradiction: false,
    };

    const updated = await store.upsertFounder({
      ...founder,
      claims: [...(founder.claims ?? []), claim],
    });

    const product = await store.getProductForFounder(id);
    if (product) {
      await store.upsertProduct({
        ...product,
        traction_claims: [...(product.traction_claims ?? []), claim],
      });
    }

    return NextResponse.json({
      ok: true,
      probe,
      founder: updated,
      note: probe
        ? `Probe claim attached (evidence: ${evidenceUrl}) — run 3-axis screen for Trust contradiction + url_diligence → $100K NO`
        : "Claim attached — run screen to evaluate Trust",
    });
  });
}
