"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type MemoryState = {
  configured: boolean;
  brand: { name: string; url: string } | null;
  containerTag?: string;
  contextLines?: string[];
  staticFacts?: string[];
  hits?: Array<{ id: string; text: string; similarity?: number; kind: string }>;
  live?: boolean;
  note?: string;
};

export default function MemoryPage() {
  const [state, setState] = useState<MemoryState | null>(null);
  const [q, setQ] = useState("brand tone and ICP");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async (query?: string) => {
    setError(null);
    const qs = query ? `?q=${encodeURIComponent(query)}` : "";
    const res = await fetch(`/api/marketing/memory${qs}`);
    const data = (await res.json()) as MemoryState & { error?: string };
    if (!res.ok) {
      setError(data.error || "Failed to load memory");
      return;
    }
    setState(data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sync() {
    setBusy(true);
    setBanner(null);
    setError(null);
    try {
      const res = await fetch("/api/marketing/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q }),
      });
      const data = (await res.json()) as {
        error?: string;
        live?: boolean;
        sync?: { factCount?: number; containerTag?: string; error?: string };
      };
      if (!res.ok) {
        setError(data.error || "Sync failed");
        return;
      }
      setBanner(
        data.live
          ? `Synced ${data.sync?.factCount ?? 0} facts → ${data.sync?.containerTag}`
          : data.sync?.error || "Sync finished offline",
      );
      await load(q);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="section-label mb-2">Persistent memory</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Brand memory
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Supermemory holds evolving brand voice / ICP facts so drafts don&apos;t
        lose context. Founder Score stays in the local VC Brain store — this
        layer is for marketing memory.
      </p>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {banner ? (
        <p className="mt-4 text-sm text-ok" role="status">
          {banner}
        </p>
      ) : null}

      {!state ? (
        <p className="mt-8 text-sm text-muted">Loading…</p>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="panel p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Status
            </p>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">SUPERMEMORY_API_KEY</dt>
                <dd className="font-mono text-ink">
                  {state.configured ? "configured · live path" : "unset · offline"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Container</dt>
                <dd className="break-all font-mono text-ink">
                  {state.containerTag ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Local brand</dt>
                <dd className="text-ink">
                  {state.brand ? (
                    <a
                      href={state.brand.url}
                      className="focus-ring text-accent hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {state.brand.name}
                    </a>
                  ) : (
                    "none"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Recall</dt>
                <dd className={state.live ? "text-ok" : "text-warn"}>
                  {state.live ? "live hits" : "empty / offline"}
                </dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-muted">{state.note}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              className="input-field focus-ring min-w-[200px] flex-1 font-mono text-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Memory query"
              placeholder="brand tone and ICP"
            />
            <button
              type="button"
              className="btn-ghost focus-ring"
              disabled={busy}
              onClick={() => void load(q)}
            >
              Search
            </button>
            <button
              type="button"
              className="btn-primary focus-ring"
              disabled={busy || !state.brand}
              onClick={() => void sync()}
            >
              {busy ? "Syncing…" : "Sync brand → Supermemory"}
            </button>
          </div>

          {!state.brand ? (
            <div className="panel p-4">
              <p className="text-sm text-muted">
                No local brand yet. Run onboarding to scrape + sync.
              </p>
              <Link
                href="/app/onboarding"
                className="btn-primary focus-ring mt-3 inline-flex !px-3 !py-1.5 text-sm"
              >
                Open onboarding
              </Link>
            </div>
          ) : null}

          {state.staticFacts && state.staticFacts.length > 0 ? (
            <section className="panel p-4">
              <p className="section-label mb-3">Profile · static</p>
              <ul className="space-y-2 text-sm text-muted">
                {state.staticFacts.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {state.contextLines && state.contextLines.length > 0 ? (
            <section className="panel p-4">
              <p className="section-label mb-3">Recall context</p>
              <ul className="space-y-2 text-sm text-muted">
                {state.contextLines.map((f) => (
                  <li key={f} className="break-words">
                    · {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {state.hits && state.hits.length > 0 ? (
            <section className="panel p-4">
              <p className="section-label mb-3">Search hits</p>
              <ul className="space-y-3">
                {state.hits.map((h) => (
                  <li key={h.id} className="border-b border-line pb-2 text-sm">
                    <span className="font-mono text-[10px] uppercase text-accent">
                      {h.kind}
                      {h.similarity != null
                        ? ` · ${(h.similarity * 100).toFixed(0)}%`
                        : ""}
                    </span>
                    <p className="mt-1 break-words text-muted">{h.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <p className="text-sm text-muted">
            Drafts in{" "}
            <Link href="/app/studio" className="focus-ring text-accent hover:underline">
              Studio
            </Link>{" "}
            pull this recall automatically when the key is set.
          </p>
        </div>
      )}
    </div>
  );
}
