import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Judge demo path",
  path: "/demo",
  description:
    "Hack-Nation Challenge 02 demo — Identify, gravity, Trust contradiction, $100K memo, agent trace.",
});

const BEATS = [
  {
    n: "01",
    title: "Identify founders (live)",
    detail:
      "Sign in → Radar → Identify · refresh. Live GitHub, Hacker News, arXiv only. Empty until you ingest is correct.",
    href: "/app/radar",
    cta: "Open radar",
  },
  {
    n: "02",
    title: "Gravity compare",
    detail:
      "Top two founders by distribution gravity — earned pull vs quiet pedigree. Illustrative numbers on marketing pages are labeled.",
    href: "/app/compare",
    cta: "Open compare",
  },
  {
    n: "03",
    title: "Profile → Gather & screen",
    detail:
      "Open any founder → Edit profile (optional links) → Gather & screen (save → deep research → 3-axis). Or Diligence probe claim first for the Trust money shot. Axes never averaged.",
    href: "/app/radar",
    cta: "Pick a founder",
  },
  {
    n: "04",
    title: "$100K memo + trace",
    detail:
      "Open memo → decision-support YES/NO/WATCH with gaps flagged. Click Trust → agent trace (url_diligence when evidence URLs exist).",
    href: "/app/radar",
    cta: "From founder → memo",
  },
  {
    n: "05",
    title: "Thesis + NL query + Activate",
    detail:
      "Configurable thesis · compound NL query · Activate draft outreach → Converge badge into the same funnel as inbound apply.",
    href: "/app/thesis",
    cta: "Thesis engine",
  },
] as const;

export default function DemoTourPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="section-label mb-2">Hack-Nation · Challenge 02</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Judge demo path (~5 min)
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Record this path for Maschmeyer judging. Live founders only — no synthetic
        cast. Press{" "}
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

      <p className="mt-12 text-sm text-muted">
        Full script:{" "}
        <span className="font-mono text-xs">hack/project files/JUDGES.md</span>
      </p>
    </div>
  );
}
