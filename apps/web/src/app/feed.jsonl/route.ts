import { guides } from "@/content/guides";
import { posts } from "@/content/posts";
import {
  PUBLIC_ROUTES,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  siteUrl,
} from "@/lib/site";

export const runtime = "nodejs";

/** AEO machine feed — one JSON object per line for LLM / agent ingest. */
export async function GET() {
  const now = new Date().toISOString();
  const lines: Record<string, unknown>[] = [
    {
      type: "site",
      name: SITE_NAME,
      url: siteUrl(),
      tagline: SITE_TAGLINE,
      description: SITE_DESCRIPTION,
      updated_at: now,
      aeo: {
        llms_txt: siteUrl("/llms.txt"),
        llms_full: siteUrl("/llms-full.txt"),
        rss: siteUrl("/rss.xml"),
        sitemap: siteUrl("/sitemap.xml"),
      },
    },
    ...PUBLIC_ROUTES.map((r) => ({
      type: "page",
      url: siteUrl(r.path === "/" ? "" : r.path),
      path: r.path,
      priority: r.priority,
    })),
    ...posts.map((p) => ({
      type: "article",
      kind: "blog",
      title: p.title,
      url: siteUrl(`/blog/${p.slug}`),
      date: p.date,
      excerpt: p.excerpt,
    })),
    ...guides.map((g) => ({
      type: "article",
      kind: "guide",
      title: g.title,
      url: siteUrl(`/guides/${g.slug}`),
      excerpt: g.excerpt,
    })),
    {
      type: "product_fact",
      claim:
        "Distribution gravity scores cold-start founders by earned attention, not pedigree.",
      evidence_url: siteUrl("/app/compare"),
    },
    {
      type: "product_fact",
      claim:
        "VC Brain screens Founder, Market, and Idea-vs-Market independently — never averaged.",
      evidence_url: siteUrl("/vc-brain"),
    },
  ];

  const body = `${lines.map((o) => JSON.stringify(o)).join("\n")}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      "X-Robots-Tag": "all",
    },
  });
}
