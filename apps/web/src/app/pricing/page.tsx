import type { Metadata } from "next";
import Link from "next/link";
import { CheckoutButton } from "@/components/CheckoutButton";
import { WaitlistForm } from "@/components/WaitlistForm";
import { BOOKING_HREF, BOOKING_LABEL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Pricing",
  path: "/pricing",
  description:
    "Solo $49 · Startup $149 · Fleet custom — agentic marketing priced like a dev tool. Dodo Payments when keyed.",
});

const tiers = [
  {
    name: "Solo",
    tier: "solo" as const,
    price: "$49",
    period: "/mo",
    forWhom: "1 founder, 1 product",
    features: [
      "Core SENSE→LEARN loops",
      "2 ingest channels (live APIs)",
      "HITL approval queue",
      "Brand memory for one product",
    ],
    checkout: true,
    highlight: false,
  },
  {
    name: "Startup",
    tier: "startup" as const,
    price: "$149",
    period: "/mo",
    forWhom: "Small team shipping fast",
    features: [
      "More channels + higher autonomy",
      "SEO / AEO agent included",
      "Higher run limits",
      "Shared brand memory",
    ],
    checkout: true,
    highlight: true,
  },
  {
    name: "Fleet",
    tier: null,
    price: "Custom",
    period: "",
    forWhom: "Agencies & multi-brand teams",
    features: [
      "Multi-brand seats",
      "Priority connectors",
      "White-label options",
      "Dedicated onboarding",
    ],
    checkout: false,
    highlight: false,
  },
] as const;

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <p className="section-label mb-3">Pricing</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Priced like a dev tool
      </h1>
      <p className="mt-4 max-w-xl text-muted">
        Not an agency retainer. Not a seat tax on writers. Pay for the fleet that
        earns distribution.
      </p>

      <div className="mt-12 grid gap-4 lg:grid-cols-3">
        {tiers.map((t) => (
          <article
            key={t.name}
            className={`panel flex flex-col p-6 ${
              t.highlight ? "border-accent/50 ring-1 ring-accent/30" : ""
            }`}
          >
            <h2 className="font-display text-2xl font-semibold">{t.name}</h2>
            <p className="mt-1 text-sm text-muted">{t.forWhom}</p>
            <p className="mt-6 font-display text-4xl font-bold">
              {t.price}
              <span className="text-lg font-normal text-muted">{t.period}</span>
            </p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-muted">
              {t.features.map((f) => (
                <li key={f}>· {f}</li>
              ))}
            </ul>
            {t.checkout && t.tier ? (
              <CheckoutButton
                tier={t.tier}
                label={t.highlight ? "Start Startup" : "Start Solo"}
                highlight={t.highlight}
              />
            ) : (
              <a
                href={BOOKING_HREF}
                className="btn-ghost focus-ring mt-8 text-center"
                {...(BOOKING_HREF.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
              >
                {BOOKING_LABEL}
              </a>
            )}
          </article>
        ))}
      </div>

      <div className="panel mt-10 max-w-2xl p-6">
        <p className="section-label mb-2">Early access</p>
        <h2 className="font-display text-xl font-semibold">
          Billing opens on Dodo — waitlist until then
        </h2>
        <p className="mt-2 text-sm text-muted">
          Checkout buttons call{" "}
          <span className="font-mono text-xs">/api/checkout</span> (Dodo
          Sessions). Without keys they route you here honestly.
        </p>
        <WaitlistForm source="pricing" showName compact cta="Join waitlist" />
        <p className="mt-4 text-sm text-muted">
          Prefer a walkthrough?{" "}
          <Link href="/get-started" className="text-accent hover:underline">
            Get started
          </Link>{" "}
          ·{" "}
          <Link href="/app" className="text-accent hover:underline">
            Live app
          </Link>
          .
        </p>
      </div>

      <p className="mt-6 text-xs text-muted">
        Payments via{" "}
        <a
          href="https://docs.dodopayments.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Dodo Payments
        </a>
        . Set{" "}
        <span className="font-mono">DODO_PAYMENTS_API_KEY</span> + product IDs
        in env. Usage add-ons for extra runs and research credits later.
      </p>
    </div>
  );
}
