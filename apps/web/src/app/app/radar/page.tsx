"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChannelIntel } from "@/components/ChannelIntel";
import { ScoreBar } from "@/components/ScoreBar";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";

type RadarFounder = {
  id: string;
  name: string;
  bio?: string;
  founder_score: number;
  score_confidence: number;
  gravity?: { gravity_score: number; abstain?: boolean };
  product?: { name: string; oneliner?: string; sector?: string } | null;
  screening?: {
    founder_axis: { score: number };
    market_axis: { score: number; label?: string; stance?: string };
    idea_axis: { score: number };
  } | null;
  thesis_fit?: "match" | "partial" | "miss";
  momentum?: number;
  fs_trend?: "improving" | "declining" | "stable";
  activation_status?: string;
};

export default function RadarPage() {
  const [founders, setFounders] = useState<RadarFounder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<"score" | "momentum">("score");
  const [hideMiss, setHideMiss] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ sort });
      if (hideMiss) qs.set("hide_miss", "1");
      const res = await fetch(`/api/founders?${qs}`);
      if (!res.ok) throw new Error("Failed to load founders");
      const data = (await res.json()) as { founders: RadarFounder[] };
      setFounders(data.founders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setFounders([]);
    } finally {
      setLoading(false);
    }
  }, [sort, hideMiss]);

  useEffect(() => {
    void load();
  }, [load]);

  async function refreshSources() {
    setBusy("ingest");
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/ingest?limit=15", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        upserted_count?: number;
        note?: string;
        sources?: {
          github?: { count: number };
          hackernews?: { count: number };
          producthunt?: { count: number };
          arxiv?: { count: number };
          accelerator?: { count: number };
          hackathon?: { count: number };
        };
      };
      if (!res.ok) throw new Error(data.error || "Ingest failed");
      const s = data.sources;
      setStatus(
        `Identify — GH ${s?.github?.count ?? "?"} · HN ${s?.hackernews?.count ?? "?"} · arXiv ${s?.arxiv?.count ?? "?"} → ${data.upserted_count ?? 0} candidates${data.note ? ` · ${data.note}` : ""}`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest failed");
    } finally {
      setBusy(null);
    }
  }

  async function screenAll() {
    setBusy("screen");
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/screen", { method: "POST" });
      const data = (await res.json()) as {
        error?: string;
        count?: number;
        failed?: number;
        results?: Array<{ decision: string }>;
      };
      if (!res.ok) throw new Error(data.error || "Screen failed");
      const yes = data.results?.filter((r) => r.decision === "yes").length ?? 0;
      setStatus(
        `Screened ${data.count ?? 0} · ${yes} yes · ${data.failed ?? 0} failed first-pass/errors`,
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screen failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Investor dashboard</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Founder radar
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Live Identify → Activate → Converge into Screening. Ranked by
            Founder Score (distribution gravity). Axes never averaged. Persisted
            to Supabase when dual-write is on.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            onClick={() => void refreshSources()}
            disabled={Boolean(busy)}
          >
            {busy === "ingest" ? "Identifying…" : "Identify · refresh"}
          </button>
          <button
            type="button"
            className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
            onClick={() => void screenAll()}
            disabled={Boolean(busy) || founders.length === 0}
          >
            {busy === "screen" ? "Screening…" : "Screen all"}
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={sort === "score" ? "btn-primary focus-ring !px-3 !py-1 text-xs" : "btn-ghost focus-ring !px-3 !py-1 text-xs"}
          onClick={() => setSort("score")}
        >
          Sort: score
        </button>
        <button
          type="button"
          className={sort === "momentum" ? "btn-primary focus-ring !px-3 !py-1 text-xs" : "btn-ghost focus-ring !px-3 !py-1 text-xs"}
          onClick={() => setSort("momentum")}
        >
          Sort: momentum
        </button>
        <button
          type="button"
          className={hideMiss ? "btn-primary focus-ring !px-3 !py-1 text-xs" : "btn-ghost focus-ring !px-3 !py-1 text-xs"}
          onClick={() => setHideMiss((v) => !v)}
        >
          {hideMiss ? "Showing thesis match/partial" : "Hide thesis misses"}
        </button>
        <Link href="/app/query" className="btn-ghost focus-ring !px-3 !py-1 text-xs">
          NL query
        </Link>
        <Link
          href="/app/compare"
          className="btn-primary focus-ring !px-3 !py-1 text-xs"
        >
          Gravity compare →
        </Link>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p
          className="mt-4 break-words font-mono text-xs leading-relaxed text-accent"
          role="status"
        >
          {status}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-10 text-sm text-muted">Loading radar…</p>
      ) : founders.length === 0 ? (
        <div className="mt-10 space-y-6">
          <div className="panel p-8 text-center">
            <p className="font-display text-xl font-semibold">Radar is empty</p>
            <p className="mt-2 text-sm text-muted">
              Pull live founders from GitHub, HN, arXiv, and more — or accept an
              inbound apply. Nothing is pre-seeded.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                className="btn-primary focus-ring"
                onClick={() => void refreshSources()}
                disabled={Boolean(busy)}
              >
                {busy === "ingest" ? "Identifying…" : "Identify · refresh"}
              </button>
              <Link href="/app/apply" className="btn-ghost focus-ring">
                Inbound apply
              </Link>
            </div>
          </div>
          <VcBrainTeaser compact />
        </div>
      ) : (
        <ul className="mt-8 stagger space-y-2" aria-label="Ranked founders">
          {founders.map((f, i) => {
            const mom = f.momentum ?? 0;
            const momLabel =
              mom > 0 ? `↑ +${mom.toFixed(0)}` : mom < 0 ? `↓ ${mom.toFixed(0)}` : "→ 0";
            return (
              <li key={f.id}>
                <Link
                  href={`/app/founders/${f.id}`}
                  className={`panel focus-ring flex flex-col gap-3 p-4 transition-colors hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between ${
                    f.thesis_fit === "miss" ? "opacity-60" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="font-mono text-xs text-muted">
                        #{String(i + 1).padStart(2, "0")}
                      </span>
                      <h2 className="font-display text-lg font-semibold">{f.name}</h2>
                      {f.thesis_fit ? (
                        <span
                          className={`font-mono text-[10px] uppercase ${
                            f.thesis_fit === "match"
                              ? "text-ok"
                              : f.thesis_fit === "partial"
                                ? "text-warn"
                                : "text-muted"
                          }`}
                        >
                          thesis {f.thesis_fit}
                        </span>
                      ) : null}
                      {f.activation_status === "applied" ? (
                        <span className="border border-ok/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">
                          Converged
                        </span>
                      ) : f.activation_status &&
                        f.activation_status !== "none" ? (
                        <span className="font-mono text-[10px] uppercase text-accent">
                          Activate · {f.activation_status}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted">
                      {f.product?.name ?? "No product"}
                      {f.product?.oneliner ? ` — ${f.product.oneliner}` : ""}
                    </p>
                  </div>
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-60">
                    <ScoreBar
                      value={f.founder_score}
                      label="Founder Score"
                      tone="accent"
                    />
                    <div className="flex justify-between font-mono text-[10px] tabular-nums text-muted">
                      <span>
                        gravity {f.gravity?.gravity_score?.toFixed(0) ?? "—"}
                        {f.gravity?.abstain ? " · abstain" : ""}
                      </span>
                      <span className={mom > 0 ? "text-ok" : mom < 0 ? "text-danger" : ""}>
                        {momLabel} · {f.fs_trend ?? "stable"}
                      </span>
                    </div>
                    {f.screening ? (
                      <p className="font-mono text-[10px] tabular-nums text-muted">
                        F{f.screening.founder_axis.score.toFixed(0)} · M
                        {f.screening.market_axis.score.toFixed(0)}
                        {f.screening.market_axis.stance
                          ? ` (${f.screening.market_axis.stance})`
                          : ""}{" "}
                        · I{f.screening.idea_axis.score.toFixed(0)}
                      </p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <ChannelIntel />
    </div>
  );
}
