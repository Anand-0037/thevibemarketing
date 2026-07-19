import { NextResponse } from "next/server";
import {
  billingReady,
  createDodoCheckout,
  type BillingTier,
} from "@/lib/payments/dodo";
import { siteUrl } from "@/lib/site";

export const runtime = "nodejs";

const TIERS = new Set<BillingTier>(["solo", "startup"]);

/**
 * POST { tier: "solo"|"startup", email?, name? }
 * → { checkout_url } when Dodo is keyed, else { fallback: "waitlist" }.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      tier?: string;
      email?: string;
      name?: string;
    };
    const tier = (body.tier || "").toLowerCase() as BillingTier;
    if (!TIERS.has(tier)) {
      return NextResponse.json(
        { error: "tier must be solo or startup" },
        { status: 400 },
      );
    }

    if (!billingReady(tier)) {
      return NextResponse.json({
        ok: false,
        fallback: "waitlist",
        href: "/#waitlist",
        message:
          "Billing not live yet — join the waitlist and we'll open Solo/Startup seats.",
      });
    }

    const result = await createDodoCheckout({
      tier,
      email: body.email?.trim(),
      name: body.name?.trim(),
      returnUrl: siteUrl("/checkout/success"),
    });

    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        fallback: "waitlist",
        href: "/#waitlist",
        message: result.error,
      });
    }

    return NextResponse.json({
      ok: true,
      checkout_url: result.checkout_url,
      session_id: result.session_id,
    });
  } catch (e) {
    const { reportError } = await import("@/lib/errors");
    await reportError("api/checkout", e);
    return NextResponse.json(
      {
        ok: false,
        fallback: "waitlist",
        href: "/#waitlist",
        message: e instanceof Error ? e.message : "Checkout failed",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    provider: "dodo",
    solo: billingReady("solo"),
    startup: billingReady("startup"),
    note: "Set DODO_PAYMENTS_API_KEY + DODO_PRODUCT_ID_SOLO / _STARTUP to go live.",
  });
}
