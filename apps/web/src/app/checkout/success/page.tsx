import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout complete",
  path: "/checkout/success",
  description: "Thanks for starting with vibemarketer.",
});

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 sm:px-6">
      <p className="section-label mb-2">Billing</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">
        You&apos;re in
      </h1>
      <p className="mt-4 text-muted">
        Payment received (or confirmed by Dodo). Open the app to onboard your
        brand and connect channels. We&apos;ll email next steps if anything is
        still provisioning.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/app/onboarding" className="btn-primary focus-ring">
          Brand onboarding
        </Link>
        <Link href="/get-started" className="btn-ghost focus-ring">
          Get started guide
        </Link>
      </div>
    </div>
  );
}
