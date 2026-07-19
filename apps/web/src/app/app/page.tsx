import Link from "next/link";

const VC = [
  {
    href: "/app/compare",
    title: "Gravity compare",
    blurb: "Cold-start gravity vs quiet pedigree",
  },
  {
    href: "/app/radar",
    title: "Founder radar",
    blurb: "Ranked by distribution gravity · thesis fit · momentum",
  },
  {
    href: "/app/query",
    title: "NL query",
    blurb: "Multi-attribute reasoning in one pass",
  },
  {
    href: "/app/thesis",
    title: "Thesis engine",
    blurb: "Sectors, stage, geo, check, ownership, risk",
  },
  {
    href: "/app/apply",
    title: "Inbound apply",
    blurb: "Deck + company → first-pass → same funnel",
  },
] as const;

const MKT = [
  {
    href: "/app/onboarding",
    title: "Brand onboarding",
    blurb: "URL → brand memory (Firecrawl when keyed)",
  },
  {
    href: "/app/studio",
    title: "Studio",
    blurb: "Loops + autonomy dial · draft from brand context",
  },
  {
    href: "/app/queue",
    title: "HITL queue",
    blurb: "Approve to publish · reject with note",
  },
  {
    href: "/app/report",
    title: "Weekly report",
    blurb: "LEARN rollup — drafts, loops, publishes",
  },
  {
    href: "/app/connectors",
    title: "Connect accounts",
    blurb: "OAuth via Composio — publish after connect",
  },
] as const;

export default function AppHomePage() {
  return (
    <div>
      <p className="section-label mb-2">Command center</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        One engine, two heads
      </h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Marketing fleet creates distribution. VC Brain measures it to source
        founders. Shared spine: ingest → memory → reason → trace.
      </p>
      <div className="panel mt-6 max-w-xl border-accent/30 p-4">
        <p className="section-label mb-1">Keyboard</p>
        <p className="font-display text-lg font-semibold">
          Press{" "}
          <kbd className="border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-sm text-accent">
            ⌘K
          </kbd>{" "}
          for shortcuts
        </p>
        <p className="mt-2 text-sm text-muted">
          Radar · Gravity compare · Studio · NL query · Report. Floating ⌘K
          (bottom-right).
        </p>
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-semibold">VC Brain</h2>
          <Link href="/vc-brain" className="text-xs text-accent hover:underline">
            Landing →
          </Link>
        </div>
        <ul className="mt-4 grid gap-px bg-line sm:grid-cols-2">
          {VC.map((x) => (
            <li key={x.href}>
              <Link
                href={x.href}
                className="block bg-bg-panel p-5 transition-colors hover:bg-bg-elevated focus-ring"
              >
                <p className="font-display font-semibold">{x.title}</p>
                <p className="mt-1 text-sm text-muted">{x.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">
          Start:{" "}
          <Link href="/app/radar" className="text-accent hover:underline">
            radar
          </Link>{" "}
          →{" "}
          <Link href="/app/compare" className="text-accent hover:underline">
            gravity compare
          </Link>{" "}
          ·{" "}
          <Link href="/get-started" className="text-accent hover:underline">
            get started
          </Link>
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Marketing fleet</h2>
        <ul className="mt-4 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {MKT.map((x) => (
            <li key={x.href}>
              <Link
                href={x.href}
                className="block bg-bg-panel p-5 transition-colors hover:bg-bg-elevated focus-ring"
              >
                <p className="font-display font-semibold">{x.title}</p>
                <p className="mt-1 text-sm text-muted">{x.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-xl font-semibold">Pipeline status</h2>
        <dl className="mt-4 grid gap-3 font-mono text-xs text-muted sm:grid-cols-2">
          <div className="border border-line p-3">
            <dt className="text-accent">Sourcing → Screening → Diligence → Decision</dt>
            <dd className="mt-1">
              VC Brain spine — live. Portfolio monitoring &amp; fund ops stay out
              of this surface.
            </dd>
          </div>
          <div className="border border-line p-3">
            <dt className="text-accent">SENSE → THINK → CREATE → GATE → ACT → LEARN</dt>
            <dd className="mt-1">Marketing loop primitive. Loops run from Studio.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
