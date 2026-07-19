import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingStepList,
} from "@/components/MarketingPage";
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
    title: "Diligence probe → Screen",
    detail:
      "Open any founder → Diligence probe claim → Run 3-axis screen. Watch Trust contradiction fire. Axes never averaged.",
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
    <>
      <MarketingPageHero
        narrow
        label="Hack-Nation · Challenge 02"
        title="Judge demo path (~5 min)"
        lead={
          <>
            Record this path for Maschmeyer judging. Live founders only — no
            synthetic cast. Press{" "}
            <kbd className="border border-line px-1.5 py-0.5 font-mono text-xs text-accent">
              ⌘K
            </kbd>{" "}
            inside the app for shortcuts.
          </>
        }
        actions={
          <>
            <Link href="/app/radar" className="btn-primary focus-ring text-base">
              Start at radar
            </Link>
            <Link href="/vc-brain" className="btn-ghost focus-ring text-base">
              VC Brain overview
            </Link>
          </>
        }
      />

      <MarketingSection flush>
        <MarketingStepList steps={BEATS} />
        <p className="mt-4 text-sm text-muted">
          Full script:{" "}
          <span className="font-mono text-xs">hack/project files/JUDGES.md</span>
        </p>
      </MarketingSection>
    </>
  );
}
