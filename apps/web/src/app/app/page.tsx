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
    blurb: "URL → brand brief and on-voice context",
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
      <p className="section-label mb-3">Command center</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        VC Brain · start here
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
        Investor workflow: Identify → gravity → 3-axis screen → Trust → $100K
        memo. Marketing fleet is below (same engine).
      </p>
      <div className="panel mt-8 max-w-xl border-accent/40 p-5">
        <p className="section-label mb-1 text-accent">Judge path</p>
        <p className="text-sm leading-relaxed text-muted">
          Radar → Identify · refresh → Diligence probe claim → Screen → memo →
          trace. Press{" "}
          <kbd className="border border-accent/40 bg-accent/10 px-1.5 py-0.5 font-mono text-xs text-accent">
            ⌘K
          </kbd>{" "}
          for shortcuts.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/app/radar"
            className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
          >
            Open radar
          </Link>
          <Link
            href="/demo"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
          >
            Full demo checklist
          </Link>
        </div>
      </div>

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            VC Brain
          </h2>
          <Link href="/vc-brain" className="text-xs text-accent hover:underline">
            Landing →
          </Link>
        </div>
        <ul className="mt-5 stagger grid gap-px bg-line sm:grid-cols-2">
          {VC.map((x) => (
            <li key={x.href}>
              <Link
                href={x.href}
                className="focus-ring block bg-bg-panel p-5 transition-colors hover:bg-bg-elevated"
              >
                <p className="font-display font-semibold">{x.title}</p>
                <p className="mt-1 text-sm text-muted">{x.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Marketing fleet
        </h2>
        <ul className="mt-5 stagger grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {MKT.map((x) => (
            <li key={x.href}>
              <Link
                href={x.href}
                className="focus-ring block bg-bg-panel p-5 transition-colors hover:bg-bg-elevated"
              >
                <p className="font-display font-semibold">{x.title}</p>
                <p className="mt-1 text-sm text-muted">{x.blurb}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 border-t border-line pt-10">
        <h2 className="font-display text-2xl font-semibold tracking-tight">
          Pipeline status
        </h2>
        <dl className="mt-5 grid gap-3 font-mono text-xs text-muted sm:grid-cols-2">
          <div className="border border-line bg-bg-panel p-4">
            <dt className="text-accent">
              Sourcing → Screening → Diligence → Decision
            </dt>
            <dd className="mt-2 leading-relaxed">
              VC Brain spine — live. Portfolio monitoring &amp; fund ops stay out
              of this surface.
            </dd>
          </div>
          <div className="border border-line bg-bg-panel p-4">
            <dt className="text-accent">
              SENSE → THINK → CREATE → GATE → ACT → LEARN
            </dt>
            <dd className="mt-2 leading-relaxed">
              Marketing loop primitive. Loops run from Studio.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
