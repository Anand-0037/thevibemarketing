import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/MarketingPage";
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
    <>
      <MarketingPageHero
        narrow
        label="Docs"
        title="Guides"
        lead="Practical paths through the product — marketing fleet and VC Brain."
        actions={
          <Link href="/get-started" className="btn-primary focus-ring text-base">
            Get started
          </Link>
        }
      />

      <MarketingSection>
        <MarketingSectionHeading label="Shortcuts" title="Quick links" />
        <ul className="stagger grid gap-3 sm:grid-cols-2">
          {quick.map((g) => (
            <li key={g.href}>
              <Link
                href={g.href}
                className="panel focus-ring block h-full p-5 transition-colors hover:border-accent/40"
              >
                <p className="font-display text-lg font-semibold">{g.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {g.blurb}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection flush>
        <MarketingSectionHeading label="Deep dives" title="Playbooks" />
        <ul className="stagger space-y-3">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guides/${g.slug}`}
                className="panel focus-ring block p-5 transition-colors hover:border-accent/40 sm:p-6"
              >
                <h3 className="font-display text-lg font-semibold sm:text-xl">
                  {g.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {g.excerpt}
                </p>
                <p className="mt-3 text-sm text-accent">Read playbook →</p>
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>
    </>
  );
}
