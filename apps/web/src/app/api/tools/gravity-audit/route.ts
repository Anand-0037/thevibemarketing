import { NextResponse } from "next/server";
import {
  fetchUserPublicRepos,
  parseGithubInput,
  firecrawlSearch,
  scrapeMarkdown,
  scoreGravity,
  scoreGravityFromSignals,
  searchGithubPublic,
  searchHnStories,
  tavilySearch,
  type GravityBreakdown,
  type Signal,
} from "@vibe/engine";

export const runtime = "nodejs";

type AuditBody = {
  input?: string;
  stars?: number;
  forks?: number;
  hn_points?: number;
  followers?: number;
  engagement?: number;
  post_count?: number;
  shipping_events?: number;
  /** When true (default), search GH + HN + optional Tavily/Firecrawl. */
  deep?: boolean;
};

function num(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) {
    return Math.max(0, Number(v));
  }
  return undefined;
}

/** Pull stars / HN / followers etc. from free-text public-signal descriptions. */
function parseSignalText(text: string): Partial<{
  stars: number;
  forks: number;
  hn_points: number;
  followers: number;
  engagement: number;
  post_count: number;
  shipping_events: number;
}> {
  const lower = text.toLowerCase();
  const pick = (patterns: RegExp[]): number | undefined => {
    for (const re of patterns) {
      const m = lower.match(re);
      if (m?.[1]) return Number(m[1].replace(/,/g, ""));
    }
    return undefined;
  };

  return {
    stars: pick([
      /(\d[\d,]*)\s*(?:github\s+)?stars?\b/,
      /\bstars?\s*[:=]?\s*(\d[\d,]*)/,
    ]),
    forks: pick([/(\d[\d,]*)\s*forks?\b/, /\bforks?\s*[:=]?\s*(\d[\d,]*)/]),
    hn_points: pick([
      /(\d[\d,]*)\s*(?:hn|hacker\s*news)\s*(?:points?|pts?)?\b/,
      /(?:hn|hacker\s*news)\s*(?:points?|pts?)?\s*[:=]?\s*(\d[\d,]*)/,
      /(\d[\d,]*)\s*points?\s*on\s*(?:hn|hacker\s*news)/,
    ]),
    followers: pick([
      /(\d[\d,]*)\s*followers?\b/,
      /\bfollowers?\s*[:=]?\s*(\d[\d,]*)/,
    ]),
    engagement: pick([
      /(\d[\d,]*)\s*(?:engagement|reactions?|upvotes?|likes?)\b/,
    ]),
    post_count: pick([/(\d[\d,]*)\s*posts?\b/]),
    shipping_events: pick([
      /(\d[\d,]*)\s*(?:releases?|launches?|shipping\s*events?)\b/,
    ]),
  };
}

function coldStartNote(g: GravityBreakdown): string {
  const { components: c, abstain, gravity_score, confidence } = g;
  if (abstain) {
    return (
      "Cold-start note: not enough public signal mass yet. Gravity abstains when " +
      "there’s almost nothing to measure — ship in public, get a Show HN or stars, then re-run."
    );
  }
  if (c.followers < 200 && c.velocity >= 2) {
    return (
      `Cold-start note: small audience (${c.followers} followers) but strong punch-above-weight ` +
      `velocity (${c.velocity.toFixed(2)}). This is the pattern the scorer rewards — earned attention, not pedigree.`
    );
  }
  if (c.followers >= 10_000 && c.velocity < 0.05) {
    return (
      `Cold-start note: large audience (${c.followers.toLocaleString()} followers) with low velocity. ` +
      `Absolute reach is high; relative pull is quieter than a tiny account that punches above weight.`
    );
  }
  return (
    `Cold-start note: gravity ${gravity_score.toFixed(0)}/100 at ${(confidence * 100).toFixed(0)}% confidence. ` +
    `Velocity ${c.velocity.toFixed(2)}, pull ${c.pull_ratio.toFixed(2)}, cadence ${(c.cadence * 100).toFixed(0)}%. ` +
    `Scores favor earned attention relative to audience size — friendly to founders without a network.`
  );
}

function signalsFromGithub(
  items: Array<{
    external_id: string;
    url?: string;
    observed_at: string;
    metrics?: { stars?: number; forks?: number };
    author?: string;
  }>,
  followers: number,
): Signal[] {
  const now = new Date().toISOString();
  return items.map((item, i) => ({
    id: `gh-audit-${item.external_id || i}`,
    entity_type: "founder" as const,
    entity_id: "audit",
    source: "github",
    url: item.url,
    payload: {
      stars: item.metrics?.stars ?? 0,
      forks: item.metrics?.forks ?? 0,
      followers,
      engagement: (item.metrics?.stars ?? 0) + (item.metrics?.forks ?? 0),
      shipping_events: 1,
      author: item.author,
    },
    observed_at: item.observed_at || now,
    ingested_at: now,
  }));
}

function mergeMetrics(
  ...parts: Array<Partial<{
    stars: number;
    forks: number;
    hn_points: number;
    followers: number;
    engagement: number;
    post_count: number;
    shipping_events: number;
  }>>
) {
  const out = {
    stars: 0,
    forks: 0,
    hn_points: 0,
    followers: 0,
    engagement: 0,
    post_count: 0,
    shipping_events: 0,
  };
  for (const p of parts) {
    out.stars = Math.max(out.stars, p.stars ?? 0);
    out.forks = Math.max(out.forks, p.forks ?? 0);
    out.hn_points = Math.max(out.hn_points, p.hn_points ?? 0);
    out.followers = Math.max(out.followers, p.followers ?? 0);
    out.engagement = Math.max(out.engagement, p.engagement ?? 0);
    out.post_count = Math.max(out.post_count, p.post_count ?? 0);
    out.shipping_events = Math.max(out.shipping_events, p.shipping_events ?? 0);
  }
  return out;
}

export async function POST(req: Request) {
  let body: AuditBody;
  try {
    body = (await req.json()) as AuditBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = typeof body.input === "string" ? body.input.trim() : "";
  const deep = body.deep !== false;
  const explicit = {
    stars: num(body.stars),
    forks: num(body.forks),
    hn_points: num(body.hn_points),
    followers: num(body.followers),
    engagement: num(body.engagement),
    post_count: num(body.post_count),
    shipping_events: num(body.shipping_events),
  };

  const enrichment: {
    github_token: boolean;
    firecrawl: boolean;
    tavily: boolean;
    steps: string[];
    search_hits?: Array<{ kind: string; label: string; url: string }>;
  } = {
    github_token: Boolean(process.env.GITHUB_TOKEN?.trim()),
    firecrawl: Boolean(process.env.FIRECRAWL_API_KEY?.trim()),
    tavily: Boolean(process.env.TAVILY_API_KEY?.trim()),
    steps: [],
  };

  let source: "github" | "github_search" | "manual" | "parsed_text" | "deep" =
    "manual";
  let gravity: GravityBreakdown;
  let resolved: Record<string, unknown> = {};

  const gh = input ? parseGithubInput(input) : null;
  let owner: string | null = gh?.owner ?? null;
  let repo: string | undefined = gh?.repo;
  let fetched: Awaited<ReturnType<typeof fetchUserPublicRepos>> | null = null;

  if (owner) {
    enrichment.steps.push(`github:lookup users/${owner}`);
    fetched = await fetchUserPublicRepos(owner, { repo, limit: 12 });
    if (!fetched.ok || !fetched.user) {
      if (fetched.status === 401 || fetched.status === 403) {
        return NextResponse.json(
          {
            error: fetched.error ?? "GitHub auth failed",
            status: fetched.status,
            hint:
              "Set GITHUB_TOKEN in the repo-root .env (classic PAT or fine-grained with Metadata + Contents: Read on public repos). Restart `pnpm dev` after saving.",
            enrichment,
          },
          { status: 502 },
        );
      }
      // 404 or other — fall through to public search
      enrichment.steps.push(
        `github:user ${fetched.error ?? "miss"} → public search`,
      );
      owner = null;
      fetched = null;
    }
  }

  if (!owner && input && deep) {
    enrichment.steps.push(`github:search "${input.slice(0, 64)}"`);
    const search = await searchGithubPublic(input, 5);
    if (search.hits.length > 0) {
      enrichment.search_hits = search.hits.slice(0, 5).map((h) => ({
        kind: h.kind,
        label: h.full_name ?? h.owner,
        url: h.html_url,
      }));
      const best =
        search.hits.find((h) => h.kind === "repo") ?? search.hits[0]!;
      owner = best.owner;
      repo = best.repo;
      enrichment.steps.push(
        `github:resolved ${best.full_name ?? best.owner} via search`,
      );
      fetched = await fetchUserPublicRepos(owner, { repo, limit: 12 });
      source = "github_search";
    } else if (search.error) {
      enrichment.steps.push(`github:search failed — ${search.error}`);
    }
  }

  // Deep public enrichment (HN always; Tavily/Firecrawl when keyed)
  let deepMetrics: ReturnType<typeof parseSignalText> = {};
  const deepEvidence: string[] = [];

  if (deep && input) {
    enrichment.steps.push("hn:algolia search");
    const hn = await searchHnStories(input, 6);
    if (hn.ok && hn.items.length > 0) {
      const topPts = Math.max(
        ...hn.items.map((i) => i.metrics?.hn_points ?? 0),
        0,
      );
      if (topPts > 0) {
        deepMetrics = mergeMetrics(deepMetrics, {
          hn_points: topPts,
          engagement: topPts,
          post_count: hn.items.length,
          shipping_events: 1,
        });
        deepEvidence.push(
          `hn: top story ${topPts} pts — ${hn.items[0]?.title?.slice(0, 80)}`,
        );
        enrichment.steps.push(`hn: ${hn.items.length} stories, top ${topPts} pts`);
      }
    }

    if (enrichment.tavily) {
      enrichment.steps.push("tavily:web search");
      const tv = await tavilySearch(
        `${input} github stars OR show hn OR product hunt`,
        { maxResults: 5, searchDepth: "basic" },
      );
      if (tv.ok) {
        const blob = [tv.answer ?? "", ...tv.results.map((r) => r.content)].join(
          "\n",
        );
        const parsed = parseSignalText(blob);
        deepMetrics = mergeMetrics(deepMetrics, parsed);
        for (const r of tv.results.slice(0, 3)) {
          deepEvidence.push(`tavily: ${r.title.slice(0, 72)} · ${r.url}`);
        }
        enrichment.steps.push(`tavily: ${tv.results.length} hits`);
      } else {
        enrichment.steps.push(`tavily: skip — ${tv.error}`);
      }
    } else {
      enrichment.steps.push("tavily: skipped (no TAVILY_API_KEY)");
    }

    const scrapeUrl =
      (fetched?.items?.[0]?.url as string | undefined) ||
      (owner && repo
        ? `https://github.com/${owner}/${repo}`
        : enrichment.search_hits?.[0]?.url);
    if (enrichment.firecrawl) {
      // Prefer Firecrawl search (markdown on hits) for product names; else single scrape.
      if (!scrapeUrl || !/^https?:\/\/github\.com/i.test(scrapeUrl)) {
        enrichment.steps.push("firecrawl:search (limit 2, markdown)");
        const fc = await firecrawlSearch(`${input} github OR launch`, {
          limit: 2,
          scrapeMarkdown: true,
        });
        if (fc.ok) {
          const blob = fc.hits.map((h) => h.markdown || h.description || "").join("\n");
          deepMetrics = mergeMetrics(deepMetrics, parseSignalText(blob.slice(0, 12_000)));
          for (const h of fc.hits.slice(0, 2)) {
            deepEvidence.push(`firecrawl: ${h.title.slice(0, 64)} · ${h.url}`);
          }
          enrichment.steps.push(`firecrawl: ${fc.hits.length} search hits`);
        } else {
          enrichment.steps.push(`firecrawl:search skip — ${fc.error}`);
        }
      }
      if (scrapeUrl) {
        enrichment.steps.push(`firecrawl:markdown ${scrapeUrl.slice(0, 64)}`);
        const md = await scrapeMarkdown(scrapeUrl);
        if (md) {
          deepMetrics = mergeMetrics(deepMetrics, parseSignalText(md.slice(0, 12_000)));
          deepEvidence.push(`firecrawl: scraped ${scrapeUrl.slice(0, 80)}`);
          enrichment.steps.push(`firecrawl: ${md.length} chars markdown (1 credit)`);
        } else {
          enrichment.steps.push("firecrawl: no markdown returned");
        }
      }
    } else {
      enrichment.steps.push("firecrawl: skipped (no FIRECRAWL_API_KEY)");
    }
  }

  if (fetched?.ok && fetched.user) {
    const followers = Math.max(
      fetched.user.followers,
      explicit.followers ?? 0,
      deepMetrics.followers ?? 0,
    );
    const signals = signalsFromGithub(fetched.items, followers);
    const ghStars = signals.reduce(
      (s, x) => s + Number(x.payload?.stars ?? 0),
      0,
    );
    const ghForks = signals.reduce(
      (s, x) => s + Number(x.payload?.forks ?? 0),
      0,
    );

    if (signals.length === 0 && !deepMetrics.hn_points && !explicit.hn_points) {
      gravity = scoreGravity({
        stars: explicit.stars ?? 0,
        forks: explicit.forks ?? 0,
        hn_points: explicit.hn_points ?? deepMetrics.hn_points ?? 0,
        followers,
        engagement: explicit.engagement ?? 0,
        post_count: explicit.post_count ?? 0,
        shipping_events: explicit.shipping_events ?? 0,
        evidence: [
          `github:user ${fetched.user.login} (${followers} followers, no public repos)`,
          ...deepEvidence,
        ],
      });
    } else {
      const metrics = mergeMetrics(
        {
          stars: Math.max(ghStars, explicit.stars ?? 0),
          forks: Math.max(ghForks, explicit.forks ?? 0),
          followers,
          hn_points: explicit.hn_points ?? 0,
          engagement: explicit.engagement,
          post_count: explicit.post_count,
          shipping_events: explicit.shipping_events ?? (signals.length > 0 ? 1 : 0),
        },
        deepMetrics,
      );
      gravity = scoreGravity({
        ...metrics,
        engagement:
          metrics.engagement ||
          metrics.stars + metrics.forks + metrics.hn_points,
        post_count: metrics.post_count || (metrics.engagement > 0 ? 2 : 0),
        shipping_events:
          metrics.shipping_events ||
          (metrics.stars > 0 || metrics.hn_points > 0 ? 1 : 0),
        window_months: 3,
        evidence: [
          `github:${fetched.user.login}${repo ? `/${repo}` : ""}`,
          ...deepEvidence,
        ],
      });
    }

    if (source !== "github_search") source = deep ? "deep" : "github";
    if (source === "github_search" && deep) source = "deep";

    resolved = {
      owner: fetched.user.login,
      repo: repo ?? null,
      followers,
      repos_scored: fetched.items.length,
      repos: fetched.items.slice(0, 5).map((r) => ({
        name: r.title,
        stars: r.metrics?.stars ?? 0,
        forks: r.metrics?.forks ?? 0,
        url: r.url,
      })),
      deep_metrics: deepMetrics,
    };
  } else {
    const fromText = input ? parseSignalText(input) : {};
    const metrics = mergeMetrics(
      {
        stars: explicit.stars ?? fromText.stars ?? 0,
        forks: explicit.forks ?? fromText.forks ?? 0,
        hn_points: explicit.hn_points ?? fromText.hn_points ?? 0,
        followers: explicit.followers ?? fromText.followers ?? 0,
        engagement: explicit.engagement ?? fromText.engagement,
        post_count: explicit.post_count ?? fromText.post_count,
        shipping_events: explicit.shipping_events ?? fromText.shipping_events,
      },
      deepMetrics,
    );
    metrics.engagement =
      metrics.engagement ||
      metrics.stars + metrics.forks + metrics.hn_points;
    metrics.post_count =
      metrics.post_count || (metrics.engagement > 0 ? 2 : 0);
    metrics.shipping_events =
      metrics.shipping_events ||
      (metrics.stars > 0 || metrics.hn_points > 0 ? 1 : 0);

    const hasAny =
      metrics.stars +
        metrics.forks +
        metrics.hn_points +
        metrics.followers +
        metrics.engagement +
        metrics.post_count +
        metrics.shipping_events >
      0;

    if (!hasAny && !input) {
      return NextResponse.json(
        {
          error:
            "Provide a GitHub username, repo URL, product name, or public signal numbers.",
          enrichment,
        },
        { status: 400 },
      );
    }

    if (!hasAny && input) {
      return NextResponse.json(
        {
          error: `No GitHub user/repo matched “${input.slice(0, 48)}”, and no public signals were found.`,
          hint:
            "Try owner/repo (e.g. Anand-0037/KaggleIngest), a GitHub URL, or paste stars / HN points. Add TAVILY_API_KEY for deeper web search.",
          enrichment,
        },
        { status: 404 },
      );
    }

    gravity = scoreGravity({
      ...metrics,
      window_months: 3,
      evidence: [
        input ? `query: ${input.slice(0, 160)}` : "manual: form fields",
        ...deepEvidence,
      ],
    });
    source = deep && deepEvidence.length > 0 ? "deep" : input && !gh ? "parsed_text" : "manual";
    resolved = { ...metrics, deep_metrics: deepMetrics };
  }

  return NextResponse.json({
    ok: true,
    disclaimer:
      "Not investment advice. Score is deterministic public-signal math from the VC Brain gravity engine.",
    source,
    resolved,
    enrichment,
    gravity_score: gravity.gravity_score,
    confidence: gravity.confidence,
    abstain: Boolean(gravity.abstain),
    abstain_reason: gravity.abstain_reason ?? null,
    components: gravity.components,
    evidence: gravity.evidence,
    cold_start_note: coldStartNote(gravity),
  });
}
