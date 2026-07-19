"use client";

import Link from "next/link";
import { useState } from "react";

type Props = {
  tier: "solo" | "startup";
  label: string;
  highlight?: boolean;
};

/**
 * Tries Dodo checkout; falls back to waitlist when billing isn't configured.
 */
export function CheckoutButton({ tier, label, highlight }: Props) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function start() {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        checkout_url?: string;
        fallback?: string;
        href?: string;
        message?: string;
      };
      if (data.ok && data.checkout_url) {
        window.location.href = data.checkout_url;
        return;
      }
      setNote(data.message || "Billing not live — join the waitlist.");
      window.location.href = data.href || "/#waitlist";
    } catch {
      setNote("Checkout unavailable — join the waitlist.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className={`focus-ring w-full text-center ${
          highlight ? "btn-primary" : "btn-ghost"
        }`}
      >
        {busy ? "Starting checkout…" : label}
      </button>
      {note ? (
        <p className="text-center text-xs text-muted">
          {note}{" "}
          <Link href="/#waitlist" className="text-accent hover:underline">
            Waitlist
          </Link>
        </p>
      ) : (
        <p className="text-center font-mono text-[10px] text-muted">
          Dodo when keyed · else waitlist
        </p>
      )}
    </div>
  );
}
