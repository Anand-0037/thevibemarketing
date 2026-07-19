import type { Metadata } from "next";
import Link from "next/link";
import { ConnectorWall } from "@/components/ConnectorWall";
import { FeatureGrid } from "@/components/FeatureGrid";
import { HeroFleet3D } from "@/components/HeroFleet3D";
import { JsonLd } from "@/components/JsonLd";
import { LoopDiagram } from "@/components/LoopDiagram";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";
import { WaitlistBanner } from "@/components/WaitlistBanner";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FLEET_ROLES } from "@/content/features";
import { postsSorted } from "@/content/posts";
import { faqJsonLd, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "vibemarketer",
  path: "/",
  description:
    "Autonomous AI Agent Fleet for your Marketing Department. Operates 24/365. Cursor for marketing — SEO/AEO, HITL, and VC Brain founder sourcing.",
});

const HOME_FAQS = [
  {
    question: "What is vibemarketer?",
    answer:
      "An autonomous AI agent fleet that runs SaaS marketing — strategy, content, distribution, SEO/AEO, and learning loops — with a human-in-the-loop autonomy dial.",
  },
  {
    question: "What is VC Brain?",
    answer:
      "A feature on the same engine that sources and screens founders by distribution gravity, scores three independent axes, and writes evidence-backed $100K memos.",
  },
  {
    question: "How is this different from a copywriting tool?",
    answer:
      "Agents own the full loop (sense → think → create → gate → act → learn) with persistent brand memory — not one-shot text generation.",
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
              "radial-gradient(ellipse 55% 70% at 85% 45%, rgba(212,255,74,0.14), transparent 60%), radial-gradient(ellipse 40% 50% at 10% 80%, rgba(107,140,174,0.12), transparent 55%)",
          }}
        />
        {/* Classic product hero: copy left · visual right */}
        <div className="site-shell relative grid min-h-[min(92vh,920px)] items-center gap-10 py-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12 lg:py-16">
          <div className="order-1 max-w-2xl">
            <p className="rise section-label mb-4">mission control for growth</p>
            <h1 className="rise-delay font-display text-5xl font-bold leading-[0.98] tracking-tight text-ink sm:text-6xl md:text-7xl xl:text-[5.25rem]">
              vibemarketer
            </h1>
            <p className="rise-delay-2 mt-6 max-w-xl text-xl leading-relaxed text-muted sm:text-2xl">
              Autonomous AI Agent Fleet for your Marketing Department. Operates
              24/365.
            </p>
            <div className="rise-delay-2 mt-10 flex flex-wrap gap-3">
              <Link
                href="/get-started"
                className="btn-primary focus-ring text-base"
              >
                Get started
              </Link>
              <Link href="/app" className="btn-ghost focus-ring text-base">
                Open app
              </Link>
              <a href="#waitlist" className="btn-ghost focus-ring text-base">
                Join waitlist
              </a>
            </div>
            <p className="rise-delay-2 mt-8 text-base text-muted">
              Same engine powers{" "}
              <Link href="/vc-brain" className="text-accent hover:underline">
                VC Brain
              </Link>{" "}
              — distribution gravity for founder sourcing.
            </p>
          </div>
          <div className="order-2 rise-delay-2 lg:justify-self-end">
            <HeroFleet3D />
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

      <section className="border-b border-line">
        <div className="site-shell py-16 sm:py-20">
          <p className="section-label mb-3">The fleet</p>
          <h2 className="font-display mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">
            An org chart that never sleeps
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
                Founder channels, live
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
              Distribution gravity scores hidden builders — then writes an
              evidence-backed memo for a $100K decision. Pedigree is not the score.
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
              href="mailto:anandcollege07@gmail.com"
              className="text-accent hover:underline"
            >
              anandcollege07@gmail.com
            </a>
            {" · "}
            <a
              href="https://x.com/AnandVashisht15"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              @AnandVashisht15
            </a>
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
