import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "@/content/guides";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Guides",
  path: "/guides",
  description:
    "Playbooks for Reddit SaaS marketing, launches without a marketer, HITL autonomy, and VC Brain sourcing.",
});

const quick = [
  {
    href: "/get-started",
    title: "Get started",
    blurb: "Onboarding → connect → Studio → HITL → optional VC Brain radar.",
  },
  {
    href: "/vc-brain",
    title: "VC Brain overview",
    blurb: "What the sourcing head does and how it plugs into the marketing engine.",
  },
  {
    href: "/app/onboarding",
    title: "Brand onboarding",
    blurb: "URL → brand memory (Firecrawl when keyed, heuristic offline).",
  },
  {
    href: "/app/studio",
    title: "Studio + HITL",
    blurb: "Draft posts, queue for approval, keep high-risk actions gated.",
  },
] as const;

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="section-label mb-2">Docs</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">Guides</h1>
      <p className="mt-3 text-muted">
        Practical paths through the product — marketing fleet and VC Brain.
      </p>

      <h2 className="mt-12 font-display text-xl font-semibold">Quick links</h2>
      <ul className="mt-4 space-y-3">
        {quick.map((g) => (
          <li key={g.href}>
            <Link
              href={g.href}
              className="panel focus-ring block p-4 transition-colors hover:border-accent/40"
            >
              <p className="font-display font-semibold">{g.title}</p>
              <p className="mt-1 text-sm text-muted">{g.blurb}</p>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className="mt-12 font-display text-xl font-semibold">Playbooks</h2>
      <ul className="mt-4 space-y-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="panel focus-ring block p-5 transition-colors hover:border-accent/40"
            >
              <h3 className="font-display text-lg font-semibold">{g.title}</h3>
              <p className="mt-2 text-sm text-muted">{g.excerpt}</p>
              <p className="mt-3 text-sm text-accent">Read playbook →</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
