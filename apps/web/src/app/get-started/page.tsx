import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingStepList,
} from "@/components/MarketingPage";
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
    cta: "Sign up",
  },
  {
    n: "02",
    title: "Brand brief from your URL",
    detail:
      "Paste your product URL. We extract ICP, tone, and pillars so every draft stays on-voice.",
    href: "/app/onboarding",
    cta: "Open onboarding",
  },
  {
    n: "03",
    title: "Plan and create",
    detail:
      "Generate a short campaign plan and drafts from your brand context. You choose how much autonomy to allow.",
    href: "/app/studio",
    cta: "Open Studio",
  },
  {
    n: "04",
    title: "Approve in the queue",
    detail:
      "Approve, edit, or reject with a note. Nothing publishes without your gate.",
    href: "/app/queue",
    cta: "Open queue",
  },
  {
    n: "05",
    title: "Connect channels (beta)",
    detail:
      "Connect Reddit, X, LinkedIn, and more when you are ready. Publishing stays approval-gated.",
    href: "/app/connectors",
    cta: "Connectors",
  },
  {
    n: "06",
    title: "VC Brain (optional)",
    detail:
      "Investor workflow: radar, gravity compare, diligence, and a $100K decision-support memo — not an investment offer.",
    href: "/app/radar",
    cta: "Open radar",
  },
  {
    n: "07",
    title: "Gravity Audit",
    detail:
      "Free public tool — paste a GitHub user, repo, or product name for a distribution-gravity score.",
    href: "/tools/gravity-audit",
    cta: "Run audit",
  },
] as const;

export default function GetStartedPage() {
  return (
    <>
      <MarketingPageHero
        narrow
        label="Start here"
        title="Get started"
        lead={
          <>
            Real product paths — marketing fleet first, VC Brain when you need
            founder sourcing. Prefer a guided tour?{" "}
            <Link href="/demo" className="text-accent hover:underline">
              Five-minute product tour
            </Link>
            . Press{" "}
            <kbd className="border border-line px-1.5 py-0.5 font-mono text-xs text-accent">
              ⌘K
            </kbd>{" "}
            in the app for shortcuts.
          </>
        }
        actions={
          <>
            <Link href="/signup" className="btn-primary focus-ring text-base">
              Create account
            </Link>
            <Link href="/app" className="btn-ghost focus-ring text-base">
              Open app
            </Link>
            <Link href="/demo" className="btn-ghost focus-ring text-base">
              Product tour
            </Link>
          </>
        }
      >
        <div className="panel border-accent/30 p-5">
          <p className="section-label mb-1">Fast path · VC Brain</p>
          <p className="text-sm text-muted">
            Identify live founders → gravity compare → screen → $100K memo.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/app/radar"
              className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
            >
              Founder radar
            </Link>
            <Link
              href="/app/compare"
              className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            >
              Gravity compare
            </Link>
            <Link
              href="/app/apply"
              className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            >
              Inbound apply
            </Link>
          </div>
        </div>
      </MarketingPageHero>

      <MarketingSection flush>
        <MarketingStepList steps={steps} />
      </MarketingSection>
    </>
  );
}
