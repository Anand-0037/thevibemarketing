import type { Metadata } from "next";
import Link from "next/link";
import { MarketingPageHero } from "@/components/MarketingPage";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Checkout complete",
  path: "/checkout/success",
  description: "Thanks for starting with vibemarketer.",
});

export default function CheckoutSuccessPage() {
  return (
    <MarketingPageHero
      narrow
      label="Billing"
      title="You're in"
      lead="Payment received (or confirmed by Dodo). Open the app to onboard your brand and connect channels. We'll email next steps if anything is still provisioning."
      actions={
        <>
          <Link
            href="/app/onboarding"
            className="btn-primary focus-ring text-base"
          >
            Brand onboarding
          </Link>
          <Link href="/get-started" className="btn-ghost focus-ring text-base">
            Get started guide
          </Link>
        </>
      }
    />
  );
}
