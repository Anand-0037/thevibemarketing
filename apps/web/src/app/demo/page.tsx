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
      "Top two founders by distribution gravity — earned pull vs quiet pedigree. Cold-start builders can outrank quiet pedigrees.",
    href: "/app/compare",
    cta: "Open compare",
  },
  {
    n: "03",
    title: "Profile socials → Gather & screen",
    detail:
      "Open a founder → Edit profile (GitHub · site · X · LinkedIn) → Gather & screen. Agents pull public web via Tavily · Firecrawl · GitHub · E2B, then Trust + three axes.",
    href: "/app/radar",
    cta: "Pick a founder",
  },
  {
    n: "04",
    title: "$100K memo + agent trace",
    detail:
      "Open memo → decision-support YES/NO/WATCH with gaps first. Open agent trace for profile_enrich · deep_research · url_diligence steps.",
    href: "/app/radar",
    cta: "From founder → memo",
  },
  {
    n: "05",
    title: "Thesis + NL query + Activate",
    detail:
      "Configurable thesis · compound NL query · Activate draft outreach → Converge into the same funnel as inbound apply.",
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
            Live founders only — no synthetic cast. Press{" "}
            <kbd className="border border-line px-1.5 py-0.5 font-mono text-xs text-accent">
              ⌘K
            </kbd>{" "}
            inside the app for shortcuts. Record Radar → Compare → Gather &amp;
            screen → Memo → Trace.
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
        <p className="mt-6 max-w-xl text-sm text-muted">
          Inbound-only founders score low until public signal is attached. Add a
          GitHub handle + product URL on the profile, then run{" "}
          <strong className="text-ink">Gather &amp; screen</strong> so
          distribution gravity can update from live APIs.
        </p>
      </MarketingSection>
    </>
  );
}
