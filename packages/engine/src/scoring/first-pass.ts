import type { Founder, Product, Thesis } from "../types";

export type FirstPassResult = {
  pass: boolean;
  reasons: string[];
  checks: Array<{ name: string; ok: boolean; detail: string }>;
};

/**
 * Cheap gate before full 3-axis + memo analysis.
 * Removes clearly non-viable inbound/outbound apps early (brief §4).
 */
export function firstPassScreen(input: {
  founder: Founder;
  product?: Product | null;
  thesis?: Thesis | null;
  requireDeck?: boolean;
}): FirstPassResult {
  const { founder, product, thesis, requireDeck = false } = input;
  const checks: FirstPassResult["checks"] = [];
  const reasons: string[] = [];

  const hasCompany = Boolean(product?.name?.trim());
  checks.push({
    name: "company_name",
    ok: hasCompany,
    detail: hasCompany ? product!.name : "Company name missing",
  });
  if (!hasCompany) reasons.push("Company name required");

  const hasDeck =
    Boolean(product?.domain) ||
    founder.links.some((l) => /deck|pitch|doc|notion|drive|dropbox|pdf/i.test(l)) ||
    founder.claims.some((c) => /deck/i.test(c.text));
  checks.push({
    name: "deck_or_materials",
    ok: hasDeck || !requireDeck,
    detail: hasDeck
      ? "Deck / materials present"
      : requireDeck
        ? "Deck URL required for inbound"
        : "Deck optional for outbound signal",
  });
  if (requireDeck && !hasDeck) reasons.push("Deck URL required for 24h decision");

  const hasWedge = Boolean(product?.oneliner?.trim() || founder.bio?.trim());
  checks.push({
    name: "wedge",
    ok: hasWedge,
    detail: hasWedge ? "One-liner / bio present" : "No product one-liner or bio",
  });
  if (!hasWedge) reasons.push("Need a one-liner or bio for screening");

  if (thesis?.sectors?.length && product?.sector) {
    const ps = product.sector.toLowerCase();
    const hit = thesis.sectors.some(
      (t) => ps.includes(t.toLowerCase()) || t.toLowerCase().includes(ps),
    );
    checks.push({
      name: "thesis_sector",
      ok: hit,
      detail: hit
        ? `Sector "${product.sector}" fits thesis`
        : `Sector "${product.sector}" outside thesis [${thesis.sectors.join(", ")}]`,
    });
    // Hard-fail sector only on inbound applications (brief §4 fast filter).
    // Outbound stays visible so investors can still inspect / activate.
    if (!hit && requireDeck) {
      reasons.push("Sector outside fund thesis — first-pass fail");
    }
  } else {
    checks.push({
      name: "thesis_sector",
      ok: true,
      detail: "No hard sector filter applied",
    });
  }

  const thin =
    Boolean(founder.gravity.abstain) &&
    founder.claims.length === 0 &&
    (product?.traction_claims?.length ?? 0) === 0 &&
    founder.founder_score < 15;
  checks.push({
    name: "minimum_signal",
    ok: !thin,
    detail: thin
      ? "Zero claims + gravity abstain + near-zero Founder Score"
      : "Enough signal to proceed",
  });
  if (thin) reasons.push("Insufficient signal — cannot screen in 24h");

  return { pass: reasons.length === 0, reasons, checks };
}
