import type { Metadata } from "next";
import Link from "next/link";
import { FeatureGrid } from "@/components/FeatureGrid";
import { LoopDiagram } from "@/components/LoopDiagram";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/MarketingPage";
import { FLEET_ROLES } from "@/content/features";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Product",
  path: "/product",
  description:
    "vibemarketer capabilities — brand brief, campaign plans, studio drafts, HITL approval, connectors, SEO/AEO, and VC Brain.",
});

export default function ProductPage() {
  return (
    <>
      <MarketingPageHero
        label="Product"
        title="Cursor for marketing"
        lead="Brand brief from your URL, campaign plans, drafts you approve, and learning from what ships — not another scheduler or one-shot copywriter."
        actions={
          <>
            <Link href="/app/studio" className="btn-primary focus-ring text-base">
              Open Studio
            </Link>
            <Link href="/app/radar" className="btn-ghost focus-ring text-base">
              Founder radar
            </Link>
            <Link href="/vc-brain" className="btn-ghost focus-ring text-base">
              VC Brain
            </Link>
          </>
        }
      />

      <MarketingSection tight>
        <nav
          aria-label="Feature jump"
          className="flex flex-wrap gap-2 border-y border-line py-4"
        >
          {[
            ["#features", "All features"],
            ["#loop", "Loop"],
            ["#fleet", "Fleet"],
            ["#trust", "Trust"],
            ["#vc-brain", "VC Brain"],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="focus-ring px-2 py-1 font-mono text-xs uppercase tracking-widest text-muted hover:text-accent"
            >
              {label}
            </a>
          ))}
        </nav>
      </MarketingSection>

      <MarketingSection id="features" className="scroll-mt-16">
        <MarketingSectionHeading
          label="Feature map"
          title="Everything the fleet ships with"
          lead="Each capability below is part of the marketing product and opens into the live app."
        />
        <FeatureGrid compact />
      </MarketingSection>

      <MarketingSection id="loop" className="scroll-mt-16">
        <MarketingSectionHeading
          label="Operating loop"
          title="Sense → think → create → gate → act → learn"
          lead="GATE is always available — autonomy is a dial, not a one-way switch."
        />
        <LoopDiagram />
      </MarketingSection>

      <MarketingSection id="fleet" className="scroll-mt-16">
        <MarketingSectionHeading label="Fleet" title="Agent roles" />
        <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FLEET_ROLES.map((agent) => (
            <li key={agent.role} className="bg-bg-panel p-5 sm:p-6">
              <h3 className="font-display text-lg font-semibold text-accent">
                {agent.role}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {agent.job}
              </p>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection id="trust" className="scroll-mt-16">
        <MarketingSectionHeading label="Trust" title="Security & control" />
        <div className="grid gap-8 md:grid-cols-2">
          <div className="border-t border-line pt-5">
            <h3 className="font-display text-lg font-semibold">Autonomy dial</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Draft-only, approve-to-publish, or supervised engage — per channel.
              High-risk actions always hit the HITL queue.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <h3 className="font-display text-lg font-semibold">Untrusted ingest</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Scraped pages, decks, and skill files are data — stored and cited,
              never allowed to issue tool calls. Tokens stay server-side.
            </p>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection id="vc-brain" className="scroll-mt-16" flush>
        <p className="section-label mb-3">Add-on</p>
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          VC Brain
        </h2>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Same ingest → memory → reason → trace spine. Swappable head writes a
          sourcing memo instead of a social post — distribution gravity, 3-axis
          screen, Trust Scores, $100K decision.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app/radar" className="btn-primary focus-ring">
            Open radar
          </Link>
          <Link href="/vc-brain" className="btn-ghost focus-ring">
            VC Brain landing
          </Link>
          <Link href="/get-started" className="btn-ghost focus-ring">
            Get started
          </Link>
          <Link href="/signup" className="btn-ghost focus-ring">
            Start free
          </Link>
        </div>
      </MarketingSection>
    </>
  );
}
