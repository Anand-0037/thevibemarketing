import type { Metadata } from "next";
import Link from "next/link";
import { ConnectorWall } from "@/components/ConnectorWall";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Connectors",
  path: "/connectors",
  description:
    "Live Identify from GitHub, HN, and arXiv, plus Composio OAuth for Reddit, X, LinkedIn, and more.",
});

export default function ConnectorsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="section-label mb-3">Connectors</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        The wall
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Founder channels first. Ingest runs live where public APIs allow.
        Connect publish accounts via Composio OAuth. Curated Product Hunt /
        accelerator rows are labeled when not live API ingest.
      </p>
      <div className="mt-12">
        <ConnectorWall />
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/app/connectors" className="btn-primary focus-ring">
          Connect accounts
        </Link>
        <Link href="/app/studio" className="btn-ghost focus-ring">
          Studio loops
        </Link>
      </div>
      <div className="panel mt-12 max-w-2xl p-6">
        <h2 className="font-display text-xl font-semibold">Security posture</h2>
        <p className="mt-3 text-sm text-muted">
          Tokens stay server-side. Scraped and uploaded content is untrusted data —
          stored and cited, never allowed to issue tool calls. Publishing actions
          respect per-platform rate limits and HITL gates.
        </p>
      </div>
    </div>
  );
}
