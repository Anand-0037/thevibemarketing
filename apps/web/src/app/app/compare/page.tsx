"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Founder, Product } from "@vibe/engine";
import { GravityCompare, type CompareSide } from "@/components/GravityCompare";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";

type RadarRow = Founder & {
  product?: Product | null;
};

function toSide(founder: Founder, product: Product | null | undefined): CompareSide {
  const g = founder.gravity;
  return {
    id: founder.id,
    name: founder.name,
    badge: product?.sector ?? "founder",
    product: product?.name
      ? `${product.name}${product.oneliner ? ` — ${product.oneliner}` : ""}`
      : undefined,
    founder_score: founder.founder_score,
    gravity: g.gravity_score,
    audience: g.components.audience,
    engagement: g.components.engagement,
    velocity: g.components.velocity,
    pull: g.components.pull_ratio,
    followers: g.components.followers,
    note: founder.bio?.slice(0, 160) || "Live radar founder — scored from public signals.",
  };
}

export default function ComparePage() {
  const [left, setLeft] = useState<CompareSide | null>(null);
  const [right, setRight] = useState<CompareSide | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/founders?sort=score");
      if (!res.ok) throw new Error("Failed to load founders");
      const data = (await res.json()) as { founders: RadarRow[] };
      const ranked = [...data.founders].sort(
        (a, b) =>
          (b.gravity?.gravity_score ?? 0) - (a.gravity?.gravity_score ?? 0) ||
          b.founder_score - a.founder_score,
      );
      if (ranked.length < 2) {
        setLeft(null);
        setRight(null);
        setError(
          ranked.length === 0
            ? "No founders yet. Run Identify on Radar or accept an inbound Apply."
            : "Need at least two founders to compare. Identify more sources or invite another apply.",
        );
        return;
      }
      const [a, b] = ranked;
      setLeft(toSide(a, a.product));
      setRight(toSide(b, b.product));
    } catch (e) {
      setLeft(null);
      setRight(null);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <p className="section-label mb-2">VC Brain</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Gravity compare
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Top two founders on your live radar by distribution gravity. Earned
        attention vs quiet pedigree — same math that ranks Screening.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
          onClick={() => void load()}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
        <Link
          href="/app/radar"
          prefetch
          className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
        >
          Radar · Identify
        </Link>
        <Link
          href="/app/apply"
          prefetch
          className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
        >
          Inbound apply
        </Link>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading comparison…</p>
      ) : error && !left && !right ? (
        <div className="mt-10 space-y-4">
          <p className="text-sm text-warn" role="alert">
            {error}
          </p>
          <VcBrainTeaser />
        </div>
      ) : left && right ? (
        <div className="mt-10">
          <GravityCompare
            left={left}
            right={right}
            thesis="Pedigree ≠ distribution gravity."
          />
        </div>
      ) : null}
    </div>
  );
}
