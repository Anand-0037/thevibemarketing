import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/** SEO crawlers + major AI/AEO bots — public pages open, app/api closed. */
export default function robots(): MetadataRoute.Robots {
  const allowPublic = [
    "/",
    "/product",
    "/connectors",
    "/pricing",
    "/vc-brain",
    "/blog",
    "/guides",
    "/tools/",
    "/get-started",
    "/login",
    "/signup",
    "/llms.txt",
    "/llms-full.txt",
    "/feed.jsonl",
    "/rss.xml",
    "/humans.txt",
    "/brand/",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: allowPublic,
        disallow: ["/app/", "/api/", "/_next/"],
      },
      // Explicit AEO crawler allow-list (same public surface)
      {
        userAgent: "GPTBot",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
      {
        userAgent: "Google-Extended",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
      {
        userAgent: "Applebot-Extended",
        allow: allowPublic,
        disallow: ["/app/", "/api/"],
      },
    ],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl().replace(/^https?:\/\//, ""),
  };
}
