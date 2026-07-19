"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ChannelIntel } from "@/components/ChannelIntel";
import { ScoreBar } from "@/components/ScoreBar";
import { VcBrainTeaser } from "@/components/VcBrainTeaser";
import { readJsonSafe } from "@/lib/safe-json";

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
  funnel_clock?: string;
  within_24h?: boolean;
  conviction_crossed?: boolean;
  memo_decision?: string | null;
  claim_contradictions?: number;
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
      const res = await fetch(`/api/founders?${qs}`, {
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        founders?: RadarFounder[];
        error?: string;
      };
      if (res.status === 401) {
        throw new Error("Your session expired. Sign in again.");
      }
      if (!res.ok) {
        throw new Error(
          body.error || `Could not load founders (${res.status})`,
        );
      }
      setFounders(body.founders ?? []);
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
      const { data } = await readJsonSafe<{
        error?: string;
        upserted_count?: number;
        auto_screened_count?: number;
        note?: string;
        live_ok?: boolean;
        sources?: {
          github?: { count?: number; ok?: boolean; error?: string };
          hackernews?: { count?: number; ok?: boolean; error?: string };
          producthunt?: { count?: number; ok?: boolean; error?: string };
          arxiv?: { count?: number; ok?: boolean; error?: string };
          accelerator?: { count?: number };
          hackathon?: { count?: number };
        };
      }>(res);
      if (!res.ok) throw new Error(data?.error || `Ingest failed (${res.status})`);
      if (!data) throw new Error("Ingest failed — empty response");
      const s = data.sources;
      const sourceErrors = [
        s?.github?.ok === false ? `GitHub: ${s.github.error || "failed"}` : null,
        s?.hackernews?.ok === false
          ? `HN: ${s.hackernews.error || "failed"}`
          : null,
        s?.arxiv?.ok === false ? `arXiv: ${s.arxiv.error || "failed"}` : null,
      ].filter(Boolean);
      const auto =
        data.auto_screened_count && data.auto_screened_count > 0
          ? ` · auto-screened ${data.auto_screened_count}`
          : "";
      setStatus(
        [
          `Identify — live GH ${s?.github?.count ?? "?"} · HN ${s?.hackernews?.count ?? "?"} · arXiv ${s?.arxiv?.count ?? "?"}`,
          `→ ${data.upserted_count ?? 0} candidates${auto}`,
          `PH ${s?.producthunt?.count ?? 0} · accel ${s?.accelerator?.count ?? 0} · hackathon ${s?.hackathon?.count ?? 0} (not configured — never fabricated)`,
          data.note,
        ]
          .filter(Boolean)
          .join(" · "),
      );
      if (sourceErrors.length) {
        setError(sourceErrors.join(" · "));
      } else if (data.live_ok === false && !(data.upserted_count ?? 0)) {
        setError(
          "No live sources returned data. Set GITHUB_TOKEN on Vercel for reliable Identify.",
        );
      }
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
      const { data } = await readJsonSafe<{
        error?: string;
        count?: number;
        failed?: number;
        results?: Array<{ decision: string }>;
      }>(res);
      if (!res.ok) throw new Error(data?.error || `Screen failed (${res.status})`);
      if (!data) throw new Error("Screen failed — empty response");
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
            Identify → Activate → Converge → Screen. Ranked by Founder Score
            (distribution gravity). Axes never averaged. Live sources: GitHub,
            Hacker News, arXiv.
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
        <div className="mt-4 space-y-2" role="alert">
          <p className="text-sm text-danger">{error}</p>
          {/sign in|session|401|unauthorized/i.test(error) ? (
            <Link href="/login?next=/app/radar" className="text-sm text-accent hover:underline">
              Sign in →
            </Link>
          ) : null}
        </div>
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
            <p className="font-display text-xl font-semibold">No candidates yet</p>
            <p className="mt-2 text-sm text-muted">
              Run Identify to fetch public candidates from GitHub, Hacker News
              and arXiv. Each source reports Live, Empty, or Failed. Nothing is
              pre-seeded — inbound apply is optional.
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
                      {f.conviction_crossed ? (
                        <span className="border border-accent/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-accent">
                          Conviction
                        </span>
                      ) : null}
                      {f.memo_decision ? (
                        <span className="font-mono text-[10px] uppercase text-muted">
                          $100K {f.memo_decision}
                        </span>
                      ) : null}
                      {(f.claim_contradictions ?? 0) > 0 ? (
                        <span
                          className="border border-danger/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-danger"
                          title="Per-claim Trust contradictions in Memory"
                        >
                          Trust !{f.claim_contradictions}
                        </span>
                      ) : null}
                      {f.funnel_clock ? (
                        <span
                          className={`font-mono text-[10px] uppercase ${
                            f.within_24h ? "text-ok" : "text-warn"
                          }`}
                          title="Hours since first Memory write — 24h decision SLA clock"
                        >
                          {f.funnel_clock}
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
                        F
                        {Number.isFinite(f.screening.founder_axis?.score)
                          ? f.screening.founder_axis.score.toFixed(0)
                          : "—"}{" "}
                        · M
                        {Number.isFinite(f.screening.market_axis?.score)
                          ? f.screening.market_axis.score.toFixed(0)
                          : "—"}
                        {f.screening.market_axis?.stance
                          ? ` (${f.screening.market_axis.stance})`
                          : ""}{" "}
                        · I
                        {Number.isFinite(f.screening.idea_axis?.score)
                          ? f.screening.idea_axis.score.toFixed(0)
                          : "—"}
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
