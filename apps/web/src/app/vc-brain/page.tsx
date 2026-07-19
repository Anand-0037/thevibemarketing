import type { Metadata } from "next";
import Link from "next/link";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "VC Brain",
  path: "/vc-brain",
  description:
    "Distribution-native founder sourcing — Identify, 3-axis Screening, Diligence Trust Scores, $100K decision-support in 24 hours.",
  keywords: [
    "VC Brain",
    "founder sourcing",
    "distribution gravity",
    "investment memo AI",
    "Founder Score",
  ],
});

const FLOW = [
  {
    t: "Sourcing",
    d: "Identify live: GitHub · Hacker News · arXiv. Hackathons / Product Hunt / accelerators: coming soon (never fabricated). Activate → Converge into one funnel with inbound.",
  },
  {
    t: "Screening",
    d: "First-pass gate · 3 axes never averaged (Founder / Market / Idea-vs-Market) · thesis lens · persistent Founder Score with cold-start mode.",
  },
  {
    t: "Diligence",
    d: "Per-claim Trust Score · contradiction flags · URL verify when evidence links exist · validator before the memo.",
  },
  {
    t: "Decision",
    d: "Evidence memo + gaps + $100K yes/no/watch (decision-support, not an investment offer) · full agent traces.",
  },
] as const;

export default function VcBrainPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="grid items-start gap-10 lg:grid-cols-2">
        <div className="rise">
          <p className="section-label mb-3">
            Hack-Nation · Challenge 02 · Maschmeyer Group
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight">
            VC Brain
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted">
            Find exceptional founders before they fundraise — scored by{" "}
            <span className="text-ink">distribution gravity</span>, not pedigree.
            A human investor gets a $100K decision-support memo within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/app/radar" className="btn-primary focus-ring">
              Open radar
            </Link>
            <Link href="/demo" className="btn-ghost focus-ring">
              Judge demo path
            </Link>
            <Link href="/app/thesis" className="btn-ghost focus-ring">
              Thesis engine
            </Link>
          </div>
        </div>
        <div className="rise-delay">
          <VcBrainTeaser />
        </div>
      </div>

      <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {FLOW.map((x) => (
          <div key={x.t} className="border-t border-accent/40 pt-4">
            <h2 className="font-display text-xl font-semibold text-accent">{x.t}</h2>
            <p className="mt-2 text-sm text-muted">{x.d}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">How to start</h2>
        <ol className="mt-4 max-w-2xl list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            <Link href="/app/radar" className="text-accent hover:underline">
              Open radar
            </Link>{" "}
            — Identify · refresh for live GitHub + HN + arXiv signals
          </li>
          <li>
            <Link href="/app/compare" className="text-accent hover:underline">
              Gravity compare
            </Link>{" "}
            — cold-start distribution vs quiet pedigree on the same thesis
          </li>
          <li>
            Diligence probe claim → Screen → evidence memo for a $100K
            decision-support check (not an investment offer)
          </li>
        </ol>
      </section>

      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">
          Same engine as the marketing fleet
        </h2>
        <p className="mt-3 text-muted">
          vibemarketer manufactures distribution. VC Brain measures it to source
          founders. Shared spine: ingest → memory → reason → trace.
        </p>
      </section>
    </div>
  );
}
