import type { Founder } from "@vibe/engine";

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/^@/, "");
}

type FounderLookup = {
  getFounder(id: string): Promise<Founder | undefined>;
  listFounders(): Promise<Founder[]>;
};

/**
 * Resolve a founder by exact id, github handle, display name, or
 * `live_github_<handle>` shorthand (radar sometimes shows the short name).
 */
export async function resolveFounder(
  store: FounderLookup,
  rawId: string,
): Promise<Founder | undefined> {
  const id = decodeURIComponent(rawId ?? "").trim();
  if (!id) return undefined;

  const exact = await store.getFounder(id);
  if (exact) return exact;

  const key = norm(id);
  const altIds = new Set<string>([
    id,
    `live_github_${id}`,
    `live_github_${key}`,
    `live_hn_${id}`,
    `live_hn_${key}`,
    `live_arxiv_${id}`,
    `live_arxiv_${key}`,
  ]);

  const founders = await store.listFounders();
  return founders.find((f) => {
    if (altIds.has(f.id) || norm(f.id) === key) return true;
    if (norm(f.name) === key) return true;
    const gh = f.handles?.github ? norm(f.handles.github) : "";
    if (gh && (gh === key || f.id === `live_github_${gh}`)) return true;
    return false;
  });
}
