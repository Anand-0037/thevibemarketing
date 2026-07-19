"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { DOGFOOD_OPERATOR } from "@/content/dogfood-operator";
import { demoDefaultsEnabled } from "@/lib/demo";
import type { BrandContext } from "@/lib/marketing-store";

const DEMO = demoDefaultsEnabled();

function inferBrandFromUrl(url: string): Omit<BrandContext, "updated_at"> {
  let host = "product";
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep default */
  }
  const isSelf =
    /thevibemarketing/i.test(host) ||
    /thevibemarketing/i.test(url) ||
    /vibemarketer\.fun/i.test(host) ||
    /vibemarketer/i.test(url) ||
    /0xanand\.tech/i.test(host);

  if (isSelf) {
    return {
      url,
      name: DOGFOOD_OPERATOR.brand.name,
      oneliner: DOGFOOD_OPERATOR.brand.oneliner,
      icp: DOGFOOD_OPERATOR.brand.icp,
      tone: DOGFOOD_OPERATOR.brand.tone,
      pillars: [...DOGFOOD_OPERATOR.brand.pillars],
    };
  }

  const name = host.split(".")[0] || "product";
  return {
    url,
    name,
    oneliner: `${name} — SaaS product for builders who need distribution.`,
    icp: "solo SaaS founders",
    tone: "direct/technical",
    pillars: ["product-led growth", "community", "content"],
  };
}

export default function OnboardingPage() {
  const [brand, setBrand] = useState<BrandContext | null>(null);
  const [preview, setPreview] = useState<Omit<BrandContext, "updated_at"> | null>(
    () =>
      DEMO
        ? {
            url: DOGFOOD_OPERATOR.brand.url,
            name: DOGFOOD_OPERATOR.brand.name,
            oneliner: DOGFOOD_OPERATOR.brand.oneliner,
            icp: DOGFOOD_OPERATOR.brand.icp,
            tone: DOGFOOD_OPERATOR.brand.tone,
            pillars: [...DOGFOOD_OPERATOR.brand.pillars],
          }
        : null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setNote(null);
    const fd = new FormData(e.currentTarget);
    const url = String(fd.get("url") || "");
    const draft = inferBrandFromUrl(url);

    try {
      const scrapeRes = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (scrapeRes.ok) {
        const data = (await scrapeRes.json()) as {
          brand: BrandContext;
          note?: string;
        };
        setBrand(data.brand);
        setNote(data.note ?? "Brand memory saved.");
        return;
      }
      const res = await fetch("/api/marketing/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Failed to save brand");
      }
      const data = (await res.json()) as { brand: BrandContext };
      setBrand(data.brand);
      setNote("Saved pre-cached dogfood brand (Firecrawl offline/fail).");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p className="section-label mb-2">Marketing fleet</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Onboarding
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Paste your product URL — Firecrawl builds brand context when keyed;
        Studio drafts from that memory.
      </p>

      {DEMO ? (
        <div className="panel mt-4 max-w-lg border-accent/30 p-3 text-xs text-muted">
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
            Demo defaults · operator dogfood
          </p>
          <p className="mt-1 text-ink">
            {DOGFOOD_OPERATOR.name} · @{DOGFOOD_OPERATOR.x_handle} ·{" "}
            {DOGFOOD_OPERATOR.portfolio_url}
          </p>
          <p className="mt-1">{DOGFOOD_OPERATOR.education}</p>
          <p className="mt-1">{DOGFOOD_OPERATOR.highlight}</p>
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="mt-8 max-w-lg space-y-4">
        <div>
          <label htmlFor="url" className="mb-1 block text-sm text-muted">
            Product URL
          </label>
          <input
            id="url"
            name="url"
            type="url"
            required
            className="input-field focus-ring"
            placeholder="https://yourproduct.com"
            defaultValue={DEMO ? DOGFOOD_OPERATOR.product.url : undefined}
            onChange={(e) => {
              const v = e.target.value.trim();
              if (v.startsWith("http")) setPreview(inferBrandFromUrl(v));
            }}
            onFocus={(e) => {
              const v = e.target.value.trim();
              if (v.startsWith("http")) setPreview(inferBrandFromUrl(v));
            }}
          />
          {DEMO ? (
            <p className="mt-1 text-xs text-muted">
              Also try {DOGFOOD_OPERATOR.portfolio_url} — maps to the same
              dogfood brand.
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted">
              Use the public homepage you want the fleet to learn from.
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary focus-ring" disabled={saving}>
          {saving ? "Building memory…" : "Build brand memory"}
        </button>
      </form>

      {preview && !brand ? (
        <div className="panel mt-8 max-w-lg p-4">
          <p className="section-label mb-2">Preview</p>
          <p className="font-display text-lg font-semibold">{preview.name}</p>
          <p className="mt-1 text-sm text-muted">{preview.oneliner}</p>
          <p className="mt-2 text-xs text-muted">ICP: {preview.icp}</p>
          <p className="mt-1 text-xs text-muted">Tone: {preview.tone}</p>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p className="mt-4 text-sm text-ok" role="status">
          {note}
        </p>
      ) : null}

      {brand ? (
        <div className="panel mt-8 max-w-lg border-ok/40 p-4">
          <p className="section-label mb-2">Brand memory live</p>
          <p className="font-display text-xl font-semibold">{brand.name}</p>
          <p className="mt-2 text-sm text-muted">{brand.oneliner}</p>
          <p className="mt-3 text-xs text-muted">ICP: {brand.icp}</p>
          <p className="mt-1 text-xs text-muted">Tone: {brand.tone}</p>
          <ul className="mt-3 space-y-1 text-xs text-muted">
            {brand.pillars.map((p) => (
              <li key={p}>· {p}</li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/app/studio" className="btn-primary focus-ring !px-3 !py-1.5 text-sm">
              Open Studio
            </Link>
            <Link href="/app/memory" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
              Brand memory
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
