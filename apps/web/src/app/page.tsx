import type { Metadata } from "next";
import Link from "next/link";
import { ConnectorWall } from "@/components/ConnectorWall";
import { FeatureGrid } from "@/components/FeatureGrid";
import { HeroProductPreview } from "@/components/HeroProductPreview";
import { JsonLd } from "@/components/JsonLd";
import { LoopDiagram } from "@/components/LoopDiagram";
import { StackPartners } from "@/components/StackPartners";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";
import { WaitlistBanner } from "@/components/WaitlistBanner";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FLEET_ROLES } from "@/content/features";
import { postsSorted } from "@/content/posts";
import { faqJsonLd, pageMetadata } from "@/lib/seo";
import { SITE_EMAIL, SOCIAL } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "vibemarketer",
  path: "/",
  description:
    "Cursor for marketing — turn a product URL into a brand brief, a seven-day campaign, and drafts you approve before anything publishes.",
});

const HOME_FAQS = [
  {
    question: "What is vibemarketer?",
    answer:
      "A marketing workspace that turns your product URL into a brand brief, campaign plan, and approval-gated drafts — with an autonomy dial you control.",
  },
  {
    question: "What is VC Brain?",
    answer:
      "A separate founder-sourcing workflow on the same engine: distribution gravity, thesis fit, and evidence-backed memos for a $100K decision-support check (hackathon track — not an investment offer).",
  },
  {
    question: "How is this different from a copywriting tool?",
    answer:
      "It runs a full loop (sense → think → create → gate → act → learn) with brand context you can review — not one-shot text generation.",
  },
  {
    question: "Is distribution gravity for cold-start founders?",
    answer:
      "Yes. It rewards earned attention relative to audience size, so first-time founders with thin pedigrees can still rank above resume-strong quiet profiles.",
  },
];

export default function HomePage() {
  const latestPosts = postsSorted().slice(0, 3);

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />
      <WaitlistBanner />
      <section className="relative overflow-hidden border-b border-line">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            background:
              "radial-gradient(ellipse 55% 70% at 85% 45%, var(--glow-accent), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, var(--glow-cool), transparent 55%)",
          }}
        />
        {/* Product hero: one promise · one primary CTA · static visual */}
        <div className="site-shell relative grid items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-20">
          <div className="order-1 max-w-2xl">
            <p className="rise section-label mb-4">for SaaS founders</p>
            <h1 className="rise-delay font-display text-5xl font-bold leading-[0.98] tracking-tight text-ink sm:text-6xl md:text-7xl xl:text-[5.25rem]">
              vibemarketer
            </h1>
            <p className="rise-delay-2 mt-6 max-w-xl text-xl leading-relaxed text-muted sm:text-2xl">
              Paste a product or business URL. Get a brand brief, a seven-day
              campaign, and X / LinkedIn / Reddit drafts you approve before
              anything queues to publish.
            </p>
            <div className="rise-delay-2 mt-10 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="btn-primary focus-ring text-base"
              >
                Start free
              </Link>
              <Link href="/demo" className="btn-ghost focus-ring text-base">
                See how it works
              </Link>
            </div>
            <p className="rise-delay-2 mt-8 text-sm text-muted">
              Also building{" "}
              <Link href="/vc-brain" className="text-accent hover:underline">
                VC Brain
              </Link>{" "}
              — founder sourcing for investors (separate workflow).
            </p>
          </div>
          <div className="order-2 rise-delay-2 lg:justify-self-end">
            <HeroProductPreview />
          </div>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <p className="section-label mb-3">The bottleneck</p>
          <h2 className="font-display max-w-4xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            You can build anything now. Nobody can find it.
          </h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted sm:text-xl">
            AI collapsed the cost of shipping. Distribution is the scarce asset —
            attention, not code. vibemarketer runs the loop so founders stop
            dying in silence.
          </p>
        </div>
      </section>

      <section id="features" className="scroll-mt-16 border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label mb-3">Features</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                Everything the fleet ships with
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-muted">
                Marketing head first. Each feature opens into the live product.
              </p>
            </div>
            <Link
              href="/product"
              className="text-base text-accent hover:underline focus-ring"
            >
              Full product detail →
            </Link>
          </div>
          <FeatureGrid />
        </div>
      </section>

      <section className="border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <p className="section-label mb-3">How it works</p>
          <h2 className="font-display mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
            SENSE → THINK → CREATE → GATE → ACT → LEARN
          </h2>
          <LoopDiagram />
        </div>
      </section>

      <StackPartners />

      <section className="border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <p className="section-label mb-3">The fleet</p>
          <h2 className="font-display mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
            Roles that cover the marketing loop
          </h2>
          <ul className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {FLEET_ROLES.map((agent) => (
              <li
                key={agent.role}
                className="bg-bg-panel p-6 transition-colors hover:bg-bg-elevated"
              >
                <h3 className="font-display text-xl font-semibold text-accent">
                  {agent.role}
                </h3>
                <p className="mt-2 text-base text-muted">{agent.job}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label mb-3">Connectors</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Channels you can connect
              </h2>
            </div>
            <Link
              href="/connectors"
              className="text-base text-accent hover:underline focus-ring"
            >
              See full wall →
            </Link>
          </div>
          <ConnectorWall />
        </div>
      </section>

      <section className="border-b border-line">
        <div className="site-shell grid items-center gap-10 py-16 sm:py-20 lg:grid-cols-2">
          <div>
            <p className="section-label mb-3">Same engine · another head</p>
            <h2 className="font-display max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
              VC Brain finds founders the way the market finds them
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
              Distribution gravity scores builders by earned pull — then drafts an
              evidence-backed memo for a $100K decision-support check (hackathon
              track, not an investment offer). Pedigree is not the score.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app/radar" className="btn-primary focus-ring text-base">
                Open founder radar
              </Link>
              <Link href="/vc-brain" className="btn-ghost focus-ring text-base">
                Explore VC Brain
              </Link>
            </div>
          </div>
          <VcBrainTeaser compact />
        </div>
      </section>

      <section className="border-b border-line" aria-labelledby="faq-heading">
        <div className="site-shell py-16 sm:py-20">
          <p className="section-label mb-3">FAQ</p>
          <h2
            id="faq-heading"
            className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
          >
            Straight answers for builders and models
          </h2>
          <dl className="mt-10 grid gap-6 md:grid-cols-2">
            {HOME_FAQS.map((f) => (
              <div key={f.question} className="panel p-6">
                <dt className="font-display text-lg font-semibold text-ink">
                  {f.question}
                </dt>
                <dd className="mt-3 text-base leading-relaxed text-muted">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm text-muted">
            Prefer machine-readable facts?{" "}
            <a href="/llms.txt" className="text-accent hover:underline">
              llms.txt
            </a>{" "}
            ·{" "}
            <a href="/feed.jsonl" className="text-accent hover:underline">
              feed.jsonl
            </a>
          </p>
        </div>
      </section>

      <section className="border-b border-line" aria-labelledby="writing-heading">
        <div className="site-shell py-16 sm:py-20">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="section-label mb-3">Writing</p>
              <h2
                id="writing-heading"
                className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
              >
                From the blog
              </h2>
            </div>
            <Link
              href="/blog"
              className="text-base text-accent hover:underline focus-ring"
            >
              All posts →
            </Link>
          </div>
          <ul className="grid gap-6 md:grid-cols-3">
            {latestPosts.map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/blog/${p.slug}`}
                  className="block focus-ring transition-colors hover:text-accent"
                >
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                    {p.date}
                    {p.tag ? ` · ${p.tag}` : ""}
                  </p>
                  <h3 className="mt-2 font-display text-lg font-semibold text-ink">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted">{p.excerpt}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="newsletter"
        className="scroll-mt-16 border-b border-line"
        aria-labelledby="newsletter-heading"
      >
        <div className="site-shell grid gap-10 py-16 sm:py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="section-label mb-3">Newsletter</p>
            <h2
              id="newsletter-heading"
              className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              Distribution notes for builders
            </h2>
            <p className="mt-4 max-w-md text-lg text-muted">
              Owned audience &gt; rented feeds. Short letters on agentic GTM,
              gravity, and launches — drafted like the fleet, edited by a human.
            </p>
            <Link
              href="/newsletter"
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              Newsletter page →
            </Link>
          </div>
          <div className="panel p-6">
            <WaitlistForm source="newsletter" showName cta="Subscribe" />
          </div>
        </div>
      </section>

      <section id="waitlist" className="scroll-mt-16 border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <p className="section-label mb-3">Early access</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Get the fleet before the queue fills
          </h2>
          <p className="mt-3 max-w-xl text-muted">
            Product seats — separate from the newsletter. When Solo/Startup open
            on Dodo, waitlist gets first access.
          </p>
          <WaitlistForm source="waitlist" showName compact />
          <p className="mt-4 text-sm text-muted">
            Early access — we&apos;ll email when a seat opens.{" "}
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="text-accent hover:underline"
            >
              {SITE_EMAIL}
            </a>
            {SOCIAL.x ? (
              <>
                {" · "}
                <a
                  href={SOCIAL.x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  @{SOCIAL.x_handle}
                </a>
              </>
            ) : null}
            {" · "}
            <Link href="/pricing" className="text-accent hover:underline">
              Pricing
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
