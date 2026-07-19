"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Report = {
  window: string;
  brand: string | null;
  autonomy: string;
  posts: {
    total_all_time: number;
    created_7d: number;
    by_status: Record<string, number>;
    by_platform: Record<string, number>;
  };
  loops: { runs_7d: number; done: number; failed: number };
  publish: {
    stub_acts_7d: number;
    via: { hitl: number; l2: number; l3: number };
    recent: Array<{
      id: string;
      post_id: string;
      platform: string;
      at: string;
      via: string;
      note: string;
    }>;
  };
  tip: string;
  honest: string;
};

export default function ReportPage() {
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/report");
      if (!res.ok) throw new Error("Failed to load report");
      setReport((await res.json()) as Report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      if (opts?.refresh) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <p className="section-label mb-2">LEARN</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Weekly fleet report
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Rollup from local marketing store — drafts, loops, queued publishes.
        Not third-party analytics.
      </p>

      {error ? (
        <p className="mt-6 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {!report ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-8 space-y-8">
          <p className="text-sm text-accent">{report.tip}</p>
          <p className="text-xs text-muted">{report.honest}</p>

          <section>
            <h2 className="font-display text-lg font-semibold">7-day snapshot</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="panel px-4 py-3">
                <dt className="text-xs text-muted">Drafts created</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">
                  {report.posts.created_7d}
                </dd>
              </div>
              <div className="panel px-4 py-3">
                <dt className="text-xs text-muted">Queued publishes</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">
                  {report.publish.stub_acts_7d}
                </dd>
              </div>
              <div className="panel px-4 py-3">
                <dt className="text-xs text-muted">Loop runs</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">
                  {report.loops.runs_7d}
                </dd>
              </div>
              <div className="panel px-4 py-3">
                <dt className="text-xs text-muted">Autonomy</dt>
                <dd className="font-display text-2xl font-bold tabular-nums">
                  {report.autonomy}
                </dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">By status</h2>
            <ul className="mt-2 space-y-1 font-mono text-sm text-muted">
              {Object.entries(report.posts.by_status).map(([k, v]) => (
                <li key={k}>
                  {k}:{" "}
                  <span className="tabular-nums text-ink">{v}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="font-display text-lg font-semibold">Publish path</h2>
            <p className="mt-1 text-sm text-muted">
              HITL {report.publish.via.hitl} · L2 auto {report.publish.via.l2} ·
              L3 auto {report.publish.via.l3}
            </p>
            {report.publish.recent.length === 0 ? (
              <div className="mt-2">
                <p className="text-sm text-muted">No publishes in window.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    href="/app/studio"
                    className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
                  >
                    Open Studio
                  </Link>
                  <Link
                    href="/app/queue"
                    className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
                  >
                    HITL queue
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="mt-3 space-y-2">
                {report.publish.recent.map((l) => (
                  <li key={l.id} className="border-b border-line pb-2 text-sm">
                    <span className="font-mono text-xs text-accent">{l.via}</span>{" "}
                    · {l.platform} · {new Date(l.at).toLocaleString()}
                    <p className="text-xs text-muted">{l.note}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <button
            type="button"
            className="btn-ghost focus-ring"
            disabled={refreshing}
            onClick={() => void load({ refresh: true })}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      )}
    </div>
  );
}
