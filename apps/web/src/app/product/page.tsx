import type { Metadata } from "next";
import Link from "next/link";
import { FeatureGrid } from "@/components/FeatureGrid";
import { LoopDiagram } from "@/components/LoopDiagram";
import { FLEET_ROLES } from "@/content/features";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Product",
  path: "/product",
  description:
    "Every thevibemarketing feature — brand memory, agent fleet, studio, HITL, connectors, SEO/AEO, sandbox, VC Brain.",
});

export default function ProductPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="section-label mb-3">Product</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Cursor for marketing
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        An agent fleet that owns outcomes — not another scheduler, not a
        copywriter. Strategy, creation, distribution, and learning in one loop
        with memory that never forgets your startup.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/app/studio" className="btn-primary focus-ring">
          Open Studio
        </Link>
        <Link href="/app/radar" className="btn-ghost focus-ring">
          Founder radar
        </Link>
        <Link href="/vc-brain" className="btn-ghost focus-ring">
          VC Brain
        </Link>
      </div>

      <nav
        aria-label="Feature jump"
        className="mt-10 flex flex-wrap gap-2 border-y border-line py-4"
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
            className="font-mono text-xs uppercase tracking-widest text-muted hover:text-accent focus-ring px-2 py-1"
          >
            {label}
          </a>
        ))}
      </nav>

      <section id="features" className="scroll-mt-20 mt-16">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Feature map
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Each capability below is part of the marketing product and opens into
          the live app.
        </p>
        <div className="mt-8">
          <FeatureGrid compact />
        </div>
      </section>

      <section id="loop" className="scroll-mt-20 mt-20">
        <h2 className="font-display text-2xl font-semibold">The operating loop</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Work moves through six stages. GATE is always available — autonomy is a
          dial, not a one-way switch.
        </p>
        <div className="mt-6">
          <LoopDiagram />
        </div>
      </section>

      <section id="fleet" className="scroll-mt-20 mt-20">
        <h2 className="font-display text-2xl font-semibold">Agent roles</h2>
        <ul className="mt-6 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {FLEET_ROLES.map((agent) => (
            <li key={agent.role} className="bg-bg-panel p-5">
              <h3 className="font-display text-lg font-semibold text-accent">
                {agent.role}
              </h3>
              <p className="mt-2 text-sm text-muted">{agent.job}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="trust" className="scroll-mt-20 mt-20">
        <h2 className="font-display text-2xl font-semibold">Trust & security</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="border-t border-line pt-5">
            <h3 className="font-display text-lg font-semibold">Autonomy dial</h3>
            <p className="mt-3 text-sm text-muted">
              Draft-only, approve-to-publish, or supervised engage — per channel.
              High-risk actions always hit the HITL queue.
            </p>
          </div>
          <div className="border-t border-line pt-5">
            <h3 className="font-display text-lg font-semibold">Untrusted ingest</h3>
            <p className="mt-3 text-sm text-muted">
              Scraped pages, decks, and skill files are data — stored and cited,
              never allowed to issue tool calls. Tokens stay server-side.
            </p>
          </div>
        </div>
      </section>

      <section id="vc-brain" className="scroll-mt-20 mt-20 border-t border-line pt-16">
        <p className="section-label mb-3">Add-on</p>
        <h2 className="font-display text-2xl font-semibold">VC Brain</h2>
        <p className="mt-3 max-w-xl text-muted">
          Same ingest → memory → reason → trace spine. Swappable head writes a
          sourcing memo instead of a social post — distribution gravity, 3-axis
          screen, Trust Scores, $100K decision.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/vc-brain" className="btn-ghost focus-ring">
            VC Brain landing
          </Link>
          <Link href="/app/radar" className="btn-primary focus-ring">
            Open radar
          </Link>
        </div>
      </section>

      <div className="mt-16 flex flex-wrap gap-3 border-t border-line pt-10">
        <Link href="/app/studio" className="btn-primary focus-ring">
          Open Studio
        </Link>
        <Link href="/get-started" className="btn-ghost focus-ring">
          Get started
        </Link>
        <Link href="/vc-brain" className="btn-ghost focus-ring">
          VC Brain
        </Link>
        <Link href="/#waitlist" className="btn-ghost focus-ring">
          Join waitlist
        </Link>
      </div>
    </div>
  );
}
