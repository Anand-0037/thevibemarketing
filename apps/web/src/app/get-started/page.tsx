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
    title: "Create your account",
    detail:
      "Sign up so your brand brief, plans, and drafts persist across sessions.",
    href: "/signup",
  },
  {
    n: "02",
    title: "Brand brief from your URL",
    detail:
      "Paste your product URL. We extract ICP, tone, and pillars so every draft stays on-voice.",
    href: "/app/onboarding",
  },
  {
    n: "03",
    title: "Plan and create",
    detail:
      "Generate a short campaign plan and drafts from your brand context. You choose how much autonomy to allow.",
    href: "/app/studio",
  },
  {
    n: "04",
    title: "Approve in the queue",
    detail:
      "Approve, edit, or reject with a note. Nothing publishes without your gate.",
    href: "/app/queue",
  },
  {
    n: "05",
    title: "Connect channels (beta)",
    detail:
      "Connect Reddit, X, LinkedIn, and more when you are ready. Publishing stays approval-gated.",
    href: "/app/connectors",
  },
  {
    n: "06",
    title: "VC Brain (optional)",
    detail:
      "Investor workflow: radar, gravity compare, diligence, and a $100K decision-support memo — not an investment offer.",
    href: "/app/radar",
  },
  {
    n: "07",
    title: "Gravity Audit",
    detail:
      "Free public tool — paste a GitHub user, repo, or product name for a distribution-gravity score.",
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
