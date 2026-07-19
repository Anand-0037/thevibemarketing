"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Founder, Product, Screening, Signal } from "@vibe/engine";
import { AxisPanel } from "@/components/AxisPanel";
import { ScoreBar } from "@/components/ScoreBar";
import { ScreeningTheater } from "@/components/ScreeningTheater";
import { TraceDrawer } from "@/components/TraceDrawer";
import { TrustBadge } from "@/components/TrustBadge";

type Detail = {
  founder: Founder;
  product?: Product | null;
  signals: Signal[];
  screening?: Screening | null;
  memo?: { id: string; decision: string } | null;
};

export default function FounderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [enrichBusy, setEnrichBusy] = useState(false);
  const [theaterDone, setTheaterDone] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [activateNote, setActivateNote] = useState<string | null>(null);
  const [mailto, setMailto] = useState<string | null>(null);
  const [enrichNote, setEnrichNote] = useState<string | null>(null);
  const autoScreened = useRef(false);

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/founders/${id}`);
    if (!res.ok) {
      setError("Founder not found");
      setData(null);
      return;
    }
    setData((await res.json()) as Detail);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      const res = await fetch(`/api/traces/latest/${id}`);
      if (!res.ok) return;
      const body = (await res.json()) as { run_id?: string | null };
      if (body.run_id) setRunId(body.run_id);
    })();
  }, [id]);

  const runScreen = useCallback(async () => {
    setBusy(true);
    setTheaterDone(false);
    setError(null);
    try {
      const res = await fetch(`/api/screen/${id}`, { method: "POST" });
      const body = (await res.json()) as { error?: string; run_id?: string };
      if (!res.ok) throw new Error(body.error || "Screen failed");
      setRunId(body.run_id ?? null);
      setTheaterDone(true);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Screen failed");
    } finally {
      setBusy(false);
    }
  }, [id, load]);

  const runEnrich = useCallback(async () => {
    setEnrichBusy(true);
    setEnrichNote(null);
    setError(null);
    try {
      const res = await fetch(`/api/agents/enrich/${id}`, { method: "POST" });
      const body = (await res.json()) as {
        error?: string;
        ok_count?: number;
        providers_used?: string[];
        lanes?: Array<{
          role: string;
          ok: boolean;
          sandbox_id?: string;
          evidence?: string[];
          error?: string;
        }>;
      };
      if (!res.ok) throw new Error(body.error || "Enrich failed");
      const sandboxes = (body.lanes ?? [])
        .filter((l) => l.sandbox_id)
        .map((l) => `${l.role}:${l.sandbox_id}`);
      const fails = (body.lanes ?? [])
        .filter((l) => !l.ok)
        .map((l) => `${l.role}${l.error ? ` (${l.error})` : ""}`);
      setEnrichNote(
        [
          `Lanes OK ${body.ok_count ?? 0}/${body.lanes?.length ?? 0}`,
          body.providers_used?.length
            ? `providers: ${body.providers_used.join(", ")}`
            : null,
          sandboxes.length ? `E2B: ${sandboxes.join("; ")}` : "E2B: no sandbox (key or repo missing)",
          fails.length ? `failed: ${fails.join("; ")}` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrich failed");
    } finally {
      setEnrichBusy(false);
    }
  }, [id, load]);

  useEffect(() => {
    if (typeof window === "undefined" || autoScreened.current) return;
    if (new URLSearchParams(window.location.search).get("screen") === "1") {
      autoScreened.current = true;
      void runScreen();
    }
  }, [runScreen]);

  async function activate(action: "draft" | "sent" | "applied") {
    setBusy(true);
    setActivateNote(null);
    try {
      const res = await fetch(`/api/activate/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, channel: "email" }),
      });
      const body = (await res.json()) as {
        error?: string;
        note?: string;
        mailto?: string;
      };
      if (!res.ok) throw new Error(body.error || "Activate failed");
      setActivateNote(body.note ?? "OK");
      if (body.mailto) setMailto(body.mailto);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Activate failed");
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div>
        <p className="text-danger">{error}</p>
        <Link href="/app/radar" className="mt-4 inline-block text-sm text-accent">
          ← Back to radar
        </Link>
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-muted">Loading founder…</p>;
  }

  const { founder, product, signals, screening } = data;
  const g = founder.gravity;
  const history = founder.score_history ?? [];
  const activation = founder.activation;
  /** Brief: Identify (radar) → Activate (outreach) → Converge (same Screening). */
  const funnelSteps = [
    { key: "identify", label: "Identify", status: "identified" as const },
    { key: "draft", label: "Activate · draft", status: "drafted" as const },
    { key: "sent", label: "Activate · sent", status: "sent" as const },
    { key: "applied", label: "Converge", status: "applied" as const },
  ];
  const currentStatus = activation?.status ?? "none";
  const currentIdx =
    currentStatus === "none"
      ? 0 // Identified by being on radar / this page
      : Math.max(
          0,
          funnelSteps.findIndex((s) => s.status === currentStatus),
        );
  const converged = currentStatus === "applied";

  return (
    <div>
      <Link href="/app/radar" className="text-sm text-muted hover:text-accent">
        ← Radar
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {founder.name}
            </h1>
          </div>
          <p className="mt-2 max-w-xl text-sm text-muted">
            {product?.name ? `${product.name} — ` : ""}
            {product?.oneliner ?? founder.bio ?? "No bio"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
            onClick={() => void runScreen()}
            disabled={busy || enrichBusy}
          >
            {busy ? "Screening…" : "Run 3-axis screen"}
          </button>
          <button
            type="button"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            onClick={() => void runEnrich()}
            disabled={busy || enrichBusy}
            title="Fan out code/web/claim/HN/memory lanes using live API endpoints"
          >
            {enrichBusy ? "Enriching…" : "Run agent enrich"}
          </button>
          <Link
            href={`/app/founders/${id}/memo`}
            prefetch
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
          >
            Open memo
          </Link>
        </div>
      </div>

      <ScreeningTheater active={busy} complete={theaterDone && !busy} />

      {theaterDone && !busy ? (
        <div className="panel mt-4 flex flex-wrap items-center justify-between gap-3 border-accent/40 p-4">
          <p className="text-sm text-muted">
            Screen complete. Open the evidence memo for the $100K decision.
          </p>
          <Link
            href={`/app/founders/${id}/memo`}
            className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
          >
            Open $100K memo →
          </Link>
        </div>
      ) : null}

      {enrichNote ? (
        <p className="mt-3 font-mono text-xs text-muted" role="status">
          {enrichNote}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <section className="panel mt-8 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Outbound · Activate → Converge
          </h2>
          {converged ? (
            <span className="border border-ok/50 bg-ok/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ok">
              Converged · same funnel as inbound
            </span>
          ) : (
            <span className="font-mono text-[10px] uppercase text-accent">
              {activation?.status ?? "identified"}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted">
          Cold outreach, not cold investment — Activate triggers a real
          application; Converge merges into the same Screening step as inbound
          apply.
        </p>
        <div
          className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3"
          aria-label="Outbound Identify Activate Converge funnel"
        >
          {funnelSteps.map((step, idx) => {
            const active = idx <= currentIdx;
            const current =
              step.status === "identified"
                ? currentStatus === "none" || !activation
                : currentStatus === step.status;
            return (
              <div key={step.key} className="flex items-center gap-2 sm:gap-3">
                {idx > 0 ? (
                  <span
                    className={`font-mono text-xs ${
                      active ? "text-accent" : "text-muted/40"
                    }`}
                    aria-hidden
                  >
                    →
                  </span>
                ) : null}
                <span
                  className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-wider ${
                    current
                      ? "border-accent bg-accent/10 text-accent"
                      : active
                        ? "border-accent/40 text-accent/80"
                        : "border-line text-muted"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            disabled={busy}
            onClick={() => void activate("draft")}
          >
            {busy ? "Working…" : "Draft outreach"}
          </button>
          <button
            type="button"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            disabled={busy}
            onClick={() => void activate("sent")}
          >
            {busy ? "Working…" : "Mark sent"}
          </button>
          <button
            type="button"
            className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
            disabled={busy}
            onClick={() => void activate("applied")}
          >
            {busy ? "Working…" : "Mark applied → converge"}
          </button>
          {mailto ? (
            <a href={mailto} className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
              Open mailto
            </a>
          ) : null}
        </div>
        {activateNote ? (
          <p className="mt-3 font-mono text-xs text-accent">{activateNote}</p>
        ) : null}
        {activation?.body ? (
          <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap border border-line p-3 font-mono text-xs text-muted">
            {activation.subject ? `Subject: ${activation.subject}\n\n` : ""}
            {activation.body}
          </pre>
        ) : null}
      </section>

      <section className="panel mt-8 p-5">
        <h2 className="font-display text-lg font-semibold">
          Founder Score · Memory
        </h2>
        <p className="mt-1 text-xs text-muted">
          Persistent across applications — never resets. Trend from score history,
          not a substitute for the 3-axis opportunity score.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <ScoreBar value={g.gravity_score} label="Gravity" tone="accent" />
          <ScoreBar value={founder.founder_score} label="Founder Score" tone="cool" />
        </div>
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase text-muted">
            Score history ({history.length} pts)
          </p>
          {history.length >= 2 ? (
            <div className="mt-2 flex h-12 items-end gap-1">
              {history.map((h, idx) => (
                <div
                  key={`${h.at}-${idx}`}
                  className="flex-1 bg-accent/70"
                  style={{ height: `${Math.max(8, h.score)}%` }}
                  title={`${h.score.toFixed(0)} @ ${h.at.slice(0, 10)}`}
                />
              ))}
            </div>
          ) : history.length === 1 ? (
            <p className="mt-2 text-xs text-muted">
              One point recorded — trend needs 2+ history points (load samples
              or re-score after ingest).
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">
              No score history yet — persistent Founder Score still holds; trend
              appears after re-score / seed.
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <TrustBadge confidence={founder.score_confidence} />
          {g.abstain ? (
            <span className="border border-warn/40 px-2 py-0.5 font-mono text-[10px] uppercase text-warn">
              abstain · {g.abstain_reason ?? "thin signal"}
            </span>
          ) : null}
        </div>
        <ul className="mt-4 space-y-1 break-words text-sm text-muted">
          {g.evidence.map((e) => (
            <li key={e}>· {e}</li>
          ))}
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["velocity", g.components.velocity],
              ["pull", g.components.pull_ratio],
              ["cadence", g.components.cadence],
              ["engagement", g.components.engagement],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="border border-line p-2">
              <p className="font-mono text-[10px] uppercase text-muted">{k}</p>
              <p className="font-mono text-lg tabular-nums">{v.toFixed(0)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">
          Three axes — not averaged
        </h2>
        {screening ? (
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <AxisPanel
              title="Founder"
              axis={screening.founder_axis}
              description="Who they are + Founder Score as one input"
            />
            <AxisPanel
              title="Market"
              axis={screening.market_axis}
              description="Bullish / neutral / bear — independent"
            />
            <AxisPanel
              title="Idea vs Market"
              axis={screening.idea_axis}
              description="Survives as-is or team must pivot"
            />
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">
            No screening yet. Run the 3-axis screen (first-pass gate runs first).
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Signals</h2>
        <ul className="mt-3 space-y-2">
          {signals.map((s) => (
            <li key={s.id} className="panel min-w-0 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-mono text-xs text-accent">{s.source}</span>
                <span className="font-mono text-[10px] text-muted">
                  {s.observed_at?.slice(0, 10)}
                </span>
              </div>
              {s.url ? (
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.url}
                  className="mt-1 block min-w-0 break-all text-xs text-muted hover:text-accent"
                >
                  {s.url}
                </a>
              ) : (
                <span className="mt-1 block text-xs text-muted">no url</span>
              )}
            </li>
          ))}
          {signals.length === 0 ? (
            <li className="text-sm text-muted">
              No signals ingested.{" "}
              <Link
                href="/app/radar"
                className="focus-ring text-accent hover:underline"
              >
                Refresh radar →
              </Link>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">
          Claims · per-claim Trust Score
        </h2>
        <ul className="mt-3 space-y-2">
          {[...founder.claims, ...(product?.traction_claims ?? [])].map((c, i) => (
            <li
              key={`${c.text}-${i}`}
              className={`panel flex flex-wrap items-start justify-between gap-2 p-3 ${
                c.contradiction ? "claim-flash border-danger/50" : ""
              }`}
            >
              <div className="min-w-0">
                <p className="text-sm">{c.text}</p>
                <p className="mt-1 break-all font-mono text-[10px] uppercase text-muted">
                  {c.category}
                  {c.evidence_url ? ` · ${c.evidence_url}` : " · no evidence url"}
                </p>
                {c.contradiction_note ? (
                  <p className="mt-1 text-xs text-danger">{c.contradiction_note}</p>
                ) : null}
              </div>
              <TrustBadge
                confidence={c.confidence}
                contradiction={c.contradiction}
              />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <TraceDrawer runId={runId} autoOpen={theaterDone} />
      </div>
    </div>
  );
}
