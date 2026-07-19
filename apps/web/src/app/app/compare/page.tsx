"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Founder, Product } from "@vibe/engine";
import { GravityCompare, type CompareSide } from "@/components/GravityCompare";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";
import { emptyGravity } from "@/lib/normalize";

type RadarRow = Founder & {
  product?: Product | null;
  screening?: {
    founder_axis: { score: number };
    market_axis: { score: number; stance?: string };
    idea_axis: { score: number };
  } | null;
  thesis_fit?: string;
  claim_contradictions?: number;
  memo_decision?: string | null;
  memo_decision_conf?: number | null;
  funnel_clock?: string;
  within_24h?: boolean;
};

function toSide(founder: RadarRow): CompareSide {
  const g = founder.gravity?.components ? founder.gravity : emptyGravity();
  const sc = founder.screening;
  return {
    id: founder.id,
    name: founder.name,
    badge: founder.product?.sector ?? "founder",
    product: founder.product?.name
      ? `${founder.product.name}${founder.product.oneliner ? ` — ${founder.product.oneliner}` : ""}`
      : undefined,
    founder_score: Number.isFinite(founder.founder_score)
      ? founder.founder_score
      : 0,
    gravity: g.gravity_score,
    audience: g.components.audience,
    engagement: g.components.engagement,
    velocity: g.components.velocity,
    pull: g.components.pull_ratio,
    followers: g.components.followers,
    note:
      founder.bio?.slice(0, 160) ||
      "Live radar founder — scored from public signals.",
    axes: sc
      ? {
          founder: sc.founder_axis.score,
          market: sc.market_axis.score,
          idea: sc.idea_axis.score,
          market_stance: sc.market_axis.stance,
        }
      : null,
    thesis_fit: founder.thesis_fit,
    claim_contradictions: founder.claim_contradictions ?? 0,
    memo_decision: founder.memo_decision,
    memo_decision_conf: founder.memo_decision_conf,
    funnel_clock: founder.funnel_clock,
    within_24h: founder.within_24h,
    cold_start: Boolean(founder.gravity && !founder.score_history?.length),
  };
}

export default function ComparePage() {
  const [pool, setPool] = useState<RadarRow[]>([]);
  const [leftId, setLeftId] = useState<string | null>(null);
  const [rightId, setRightId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/founders?sort=score", {
        credentials: "include",
      });
      const data = (await res.json().catch(() => ({}))) as {
        founders?: RadarRow[];
        error?: string;
      };
      if (res.status === 401) {
        throw new Error("Your session expired. Sign in again.");
      }
      if (!res.ok) {
        throw new Error(
          data.error || `Could not load founders (${res.status})`,
        );
      }
      const ranked = [...(data.founders ?? [])].sort(
        (a, b) =>
          (b.gravity?.gravity_score ?? 0) - (a.gravity?.gravity_score ?? 0) ||
          b.founder_score - a.founder_score,
      );
      setPool(ranked);
      if (ranked.length < 2) {
        setLeftId(null);
        setRightId(null);
        setError(
          ranked.length === 0
            ? "No founders yet. Run Identify on Radar or accept an inbound Apply."
            : "Need at least two founders to compare. Identify more sources or invite another apply.",
        );
        return;
      }
      setLeftId((prev) =>
        prev && ranked.some((f) => f.id === prev) ? prev : ranked[0]!.id,
      );
      setRightId((prev) =>
        prev && ranked.some((f) => f.id === prev) ? prev : ranked[1]!.id,
      );
    } catch (e) {
      setPool([]);
      setLeftId(null);
      setRightId(null);
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const left = pool.find((f) => f.id === leftId);
  const right = pool.find((f) => f.id === rightId);

  return (
    <div>
      <p className="section-label mb-2">VC Brain</p>
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Gravity compare
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Side-by-side decision view: gravity, three independent axes, Trust
        contradictions, thesis fit, and $100K lean — never averaged.
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

      {pool.length >= 2 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Left
            </span>
            <select
              className="mt-1 w-full border border-line bg-bg-panel px-3 py-2 text-sm text-ink"
              value={leftId ?? ""}
              onChange={(e) => setLeftId(e.target.value)}
            >
              {pool.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · g{(f.gravity?.gravity_score ?? 0).toFixed(0)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
              Right
            </span>
            <select
              className="mt-1 w-full border border-line bg-bg-panel px-3 py-2 text-sm text-ink"
              value={rightId ?? ""}
              onChange={(e) => setRightId(e.target.value)}
            >
              {pool.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · g{(f.gravity?.gravity_score ?? 0).toFixed(0)}
                </option>
              ))}
            </select>
          </label>
        </div>
      ) : null}

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading comparison…</p>
      ) : error && !left && !right ? (
        <div className="mt-10 space-y-4">
          <p className="text-sm text-warn" role="alert">
            {error}
          </p>
          {/sign in|session|401|unauthorized/i.test(error) ? (
            <Link
              href="/login?next=/app/compare"
              className="inline-block text-sm text-accent hover:underline"
            >
              Sign in →
            </Link>
          ) : null}
          <VcBrainTeaser />
        </div>
      ) : left && right ? (
        <div className="mt-10">
          <GravityCompare
            left={toSide(left)}
            right={toSide(right)}
            thesis="Pedigree ≠ distribution gravity. Disagreement across axes is the decision."
          />
        </div>
      ) : null}
    </div>
  );
}
