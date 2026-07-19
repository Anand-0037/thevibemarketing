import type { Founder, Product } from "../types";

/**
 * Deterministic multi-query plan for deep diligence.
 * No LLM — judges can audit every query string.
 */
export function planResearchQueries(
  founder: Founder,
  product?: Product | null,
): string[] {
  const name = founder.name.trim();
  const company = (product?.name ?? name).trim();
  const sector = product?.sector?.trim();
  const domain = product?.domain?.trim();
  const gh = founder.handles.github?.replace(/^@/, "").trim();
  const oneliner = product?.oneliner?.trim();

  const queries = [
    `"${name}" founder ${company}`,
    `${company} ${sector ?? "startup"} funding OR raised OR seed`,
    `${company} competitors OR alternative`,
    oneliner
      ? `${company} ${oneliner.slice(0, 80)}`
      : `${name} ${company} product launch`,
  ];

  if (domain) {
    queries.push(`site:${domain.replace(/^https?:\/\//i, "").replace(/\/$/, "")} about OR team`);
  }
  if (gh) {
    queries.push(`${gh} github ${company}`);
  }

  // Dedupe + hard cap
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of queries) {
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
    if (out.length >= 5) break;
  }
  return out;
}
