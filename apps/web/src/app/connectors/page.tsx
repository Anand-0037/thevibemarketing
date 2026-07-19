import type { Metadata } from "next";
import Link from "next/link";
import { ConnectorWall } from "@/components/ConnectorWall";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/MarketingPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Connectors",
  path: "/connectors",
  description:
    "Live Identify from GitHub, HN, and arXiv, plus Composio OAuth for Reddit, X, LinkedIn, and more.",
});

export default function ConnectorsPage() {
  return (
    <>
      <MarketingPageHero
        label="Connectors"
        title="The wall"
        lead="Founder channels first. Ingest runs live where public APIs allow. Connect publish accounts via Composio OAuth. Curated Product Hunt / accelerator rows are labeled when not live API ingest."
        actions={
          <>
            <Link
              href="/app/connectors"
              className="btn-primary focus-ring text-base"
            >
              Connect accounts
            </Link>
            <Link href="/app/studio" className="btn-ghost focus-ring text-base">
              Studio loops
            </Link>
          </>
        }
      />

      <MarketingSection>
        <ConnectorWall />
      </MarketingSection>

      <MarketingSection flush>
        <MarketingSectionHeading
          label="Security"
          title="Tokens stay server-side"
          lead="Scraped and uploaded content is untrusted data — stored and cited, never allowed to issue tool calls. Publishing actions respect per-platform rate limits and HITL gates."
        />
      </MarketingSection>
    </>
  );
}
