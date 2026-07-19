import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Get started",
  path: "/get-started",
  description:
    "Start with brand onboarding, connect channels, run Studio loops, or open VC Brain founder radar.",
});

const steps = [
  {
    n: "01",
    title: "Open the product",
    detail:
      "Jump straight into the command center. Account signup is optional locally — create one when you want persistent sessions.",
    href: "/app",
  },
  {
    n: "02",
    title: "Brand onboarding",
    detail:
      "Paste your product URL. We build brand memory (Firecrawl when keyed) so every draft stays on-voice.",
    href: "/app/onboarding",
  },
  {
    n: "03",
    title: "Connect accounts",
    detail:
      "OAuth via Composio for Reddit, X, LinkedIn, and more. Publish queues after connect — HITL still gates outbound.",
    href: "/app/connectors",
  },
  {
    n: "04",
    title: "Studio + autonomy dial",
    detail:
      "Generate drafts from brand context. L1 = draft-only · L2 = approve-to-publish · L3 = supervised auto for connected channels.",
    href: "/app/studio",
  },
  {
    n: "05",
    title: "HITL queue",
    detail:
      "Approve, edit, or reject with a note. Nothing ships past your gate without intent.",
    href: "/app/queue",
  },
  {
    n: "06",
    title: "VC Brain — Identify + screen",
    detail:
      "Identify live founders on Radar, compare gravity, run Diligence, open the $100K memo. Same engine, sourcing head.",
    href: "/app/radar",
  },
  {
    n: "07",
    title: "Gravity Audit",
    detail:
      "Free public tool — paste a GitHub user, repo, or product name and get a deterministic distribution-gravity score.",
    href: "/tools/gravity-audit",
  },
] as const;

export default function GetStartedPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="section-label mb-2">Start here</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">
        Get started
      </h1>
      <p className="mt-3 max-w-xl text-muted">
        Real product paths — marketing fleet first, VC Brain when you need founder
        sourcing. Prefer a guided tour?{" "}
        <Link href="/demo" className="text-accent hover:underline">
          Five-minute product tour
        </Link>
        . Press{" "}
        <kbd className="border border-line px-1.5 py-0.5 font-mono text-xs text-accent">
          ⌘K
        </kbd>{" "}
        in the app for shortcuts.
      </p>

      <div className="panel mt-8 border-accent/30 p-4">
        <p className="section-label mb-1">Fast path · VC Brain</p>
        <p className="text-sm text-muted">
          Identify live founders → gravity compare → screen → $100K memo.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/app/radar" className="btn-primary focus-ring !px-3 !py-1.5 text-sm">
            Founder radar
          </Link>
          <Link href="/app/compare" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
            Gravity compare
          </Link>
          <Link href="/app/apply" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
            Inbound apply
          </Link>
        </div>
      </div>

      <ol className="mt-12 space-y-6">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4">
            <span className="font-mono text-sm text-accent">{s.n}</span>
            <div>
              <h2 className="font-display text-xl font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.detail}</p>
              <Link
                href={s.href}
                className="mt-2 inline-block text-sm text-accent hover:underline"
              >
                Open →
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/app" className="btn-primary focus-ring">
          Open app
        </Link>
        <Link href="/signup" className="btn-ghost focus-ring">
          Create account
        </Link>
        <Link href="/demo" className="btn-ghost focus-ring">
          Product tour
        </Link>
      </div>
    </div>
  );
}
