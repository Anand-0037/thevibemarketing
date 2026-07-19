import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Product tour",
  path: "/demo",
  description:
    "Tour vibemarketer — live Identify, gravity compare, screening, $100K memo, and the marketing fleet.",
});

const BEATS = [
  {
    n: "01",
    title: "Identify founders",
    detail:
      "Pull live signals from GitHub, HN, arXiv, and more into the radar. Empty is correct until you ingest.",
    href: "/app/radar",
    cta: "Open radar",
  },
  {
    n: "02",
    title: "Gravity compare",
    detail:
      "Rank the top two founders on your radar by distribution gravity — earned attention vs quiet pedigree.",
    href: "/app/compare",
    cta: "Open compare",
  },
  {
    n: "03",
    title: "Screen + Diligence",
    detail:
      "Open any founder → run the 3-axis screen, Trust/Diligence claims, and agent lanes.",
    href: "/app/radar",
    cta: "Pick a founder",
  },
  {
    n: "04",
    title: "$100K memo",
    detail:
      "Evidence-backed memo: axes never averaged, per-claim Trust, explicit gaps, yes/no/watch.",
    href: "/app/radar",
    cta: "From a founder page",
  },
  {
    n: "05",
    title: "Marketing fleet",
    detail:
      "Brand onboarding → Studio drafts → HITL queue. Same engine, create-distribution head.",
    href: "/app/onboarding",
    cta: "Start onboarding",
  },
] as const;

export default function DemoTourPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="section-label mb-2">Product tour</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">
        See the engine in five minutes
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        One spine: ingest → memory → score → trace. Two heads: marketing fleet and
        VC Brain. Founders are live data only — press{" "}
        <kbd className="border border-line px-1.5 py-0.5 font-mono text-xs text-accent">
          ⌘K
        </kbd>{" "}
        inside the app for shortcuts.
      </p>

      <ol className="mt-12 space-y-6">
        {BEATS.map((b) => (
          <li key={b.n} className="flex gap-4">
            <span className="font-mono text-sm text-accent">{b.n}</span>
            <div>
              <h2 className="font-display text-xl font-semibold">{b.title}</h2>
              <p className="mt-1 text-sm text-muted">{b.detail}</p>
              <Link
                href={b.href}
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                {b.cta} →
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/app/radar" className="btn-primary focus-ring">
          Start at radar
        </Link>
        <Link href="/get-started" className="btn-ghost focus-ring">
          Full get-started
        </Link>
        <Link href="/app" className="btn-ghost focus-ring">
          Command center
        </Link>
      </div>
    </div>
  );
}
