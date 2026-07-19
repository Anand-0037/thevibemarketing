"use client";

import { useEffect, useState } from "react";

const TOOLKITS = [
  { id: "github", label: "GitHub", note: "OAuth via Composio — good first connect test" },
  { id: "twitter", label: "X (Twitter)", note: "Publish + engage · poll for mentions" },
  { id: "linkedin", label: "LinkedIn", note: "Posts · no inbound triggers" },
  { id: "reddit", label: "Reddit", note: "Opportunity replies · HITL required" },
  { id: "gmail", label: "Gmail", note: "Outbound activate emails" },
  { id: "notion", label: "Notion", note: "Brand docs / memo export" },
] as const;

type HealthKey = {
  key: string;
  configured: boolean;
  ok: boolean;
  detail: string;
};

export default function AppConnectorsPage() {
  const [status, setStatus] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthKey[] | null>(null);
  const [catalog, setCatalog] = useState<
    Array<{ key: string; role: string; endpoints: readonly string[] }> | null
  >(null);

  useEffect(() => {
    void (async () => {
      try {
        const [hRes, cRes] = await Promise.all([
          fetch("/api/health/keys"),
          fetch("/api/agents/catalog"),
        ]);
        const hData = (await hRes.json()) as { keys?: HealthKey[] };
        const cData = (await cRes.json()) as {
          catalog?: Array<{ key: string; role: string; endpoints: string[] }>;
        };
        setHealth(hData.keys ?? []);
        setCatalog(cData.catalog ?? []);
      } catch {
        setHealth([]);
        setCatalog([]);
      }
    })();
  }, []);

  const composioOk = health?.find((k) => k.key === "COMPOSIO_API_KEY")?.ok;
  const e2b = health?.find((k) => k.key === "E2B_API_KEY");
  const openai = health?.find((k) => k.key === "OPENAI_API_KEY");

  async function connect(toolkit: string) {
    setBusy(toolkit);
    try {
      const res = await fetch("/api/composio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolkit, userId: "default_user" }),
      });
      const data = (await res.json()) as {
        status?: string;
        message?: string;
        url?: string;
        error?: string;
        toolkit?: string;
        authConfigId?: string;
      };
      if (data.status === "ok" && data.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
        setStatus((s) => ({
          ...s,
          [toolkit]: `Live OAuth opened · ${data.authConfigId ?? "linked"}`,
        }));
      } else if (data.status === "error") {
        setStatus((s) => ({
          ...s,
          [toolkit]: data.message || data.error || "Connect error",
        }));
      } else {
        setStatus((s) => ({
          ...s,
          [toolkit]:
            data.message ||
            (data.status === "stub"
              ? "Connect unavailable — set COMPOSIO_API_KEY"
              : data.status || "ok"),
        }));
      }
    } catch {
      setStatus((s) => ({ ...s, [toolkit]: "failed" }));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="panel mb-6 border-line p-3 text-xs text-muted">
        <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
          Honest wiring
        </p>
        <p className="mt-1">
          Composio OAuth connects when the key is green; publish ACT still waits
          on a connected account + tool execute. E2B code-forensics needs a Team
          key (<span className="font-mono text-ink">e2b_…</span>) — UUID keys
          fail health on purpose. Architecture is wired; live keys unlock the
          lanes.
        </p>
        {e2b && !e2b.ok ? (
          <p className="mt-2 font-mono text-[10px] text-warn">
            E2B: {e2b.detail}
          </p>
        ) : null}
        {openai && !openai.ok ? (
          <p className="mt-1 font-mono text-[10px] text-warn">
            OpenAI: {openai.detail}
          </p>
        ) : null}
        {composioOk === false ? (
          <p className="mt-1 font-mono text-[10px] text-warn">
            Composio key not healthy — connect links stay stubbed.
          </p>
        ) : null}
      </div>
      <p className="section-label mb-2">Marketing fleet</p>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Connect accounts
      </h1>
      <p className="mt-2 max-w-xl text-sm text-muted">
        Live Composio OAuth when the API key is valid — real{" "}
        <span className="text-ink">connect.composio.dev</span> links, never a fake
        window. Social has no inbound webhooks; loops poll on a schedule.
      </p>

      {health ? (
        <div className="panel mt-6 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Live key health
          </p>
          <ul className="mt-3 space-y-1 font-mono text-[11px] text-muted">
            {health.map((k) => (
              <li key={k.key}>
                <span className={k.ok ? "text-ok" : k.configured ? "text-danger" : "text-warn"}>
                  {k.ok ? "PASS" : k.configured ? "FAIL" : "SKIP"}
                </span>{" "}
                {k.key} — {k.detail}
              </li>
            ))}
          </ul>
          {openai && !openai.ok ? (
            <p className="mt-3 text-xs text-warn">
              OpenAI: auth may work while chat is quota-blocked — add billing, then
              re-check. Drafts fall back to templates until chat PASS.
            </p>
          ) : null}
          {e2b && !e2b.ok ? (
            <p className="mt-3 text-xs text-warn">
              E2B: paste Team API key (e2b_…) into .env, then re-run{" "}
              <span className="font-mono">pnpm probe:keys</span>.
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Checking keys…</p>
      )}

      <ul className="mt-8 space-y-2">
        {TOOLKITS.map((t) => (
          <li
            key={t.id}
            className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-display font-semibold">{t.label}</p>
                <span
                  className={`font-mono text-[10px] uppercase tracking-wider ${
                    composioOk ? "text-ok" : "text-warn"
                  }`}
                >
                  {composioOk ? "Live OAuth ready" : "Offline"}
                </span>
              </div>
              <p className="text-sm text-muted">{t.note}</p>
              {status[t.id] ? (
                <p className="mt-1 break-all font-mono text-[10px] text-accent">
                  {status[t.id]}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              className="btn-primary focus-ring shrink-0 !px-3 !py-1.5 text-sm"
              disabled={busy === t.id}
              onClick={() => void connect(t.id)}
              aria-label={`Connect ${t.label}`}
            >
              {busy === t.id
                ? "Connecting…"
                : composioOk
                  ? "Connect with Composio"
                  : "Try connect"}
            </button>
          </li>
        ))}
      </ul>

      {catalog && catalog.length > 0 ? (
        <div className="panel mt-10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
            Agent lanes · endpoints in use
          </p>
          <p className="mt-2 text-xs text-muted">
            On Screen, the coordinator fans out these roles. Each key only sees
            its lane tools (E2B never gets OpenAI).
          </p>
          <ul className="mt-4 space-y-4">
            {catalog.map((row) => (
              <li key={`${row.key}-${row.role}`}>
                <p className="font-mono text-xs text-ink">
                  {row.key}{" "}
                  <span className="text-muted">→ {row.role}</span>
                </p>
                <ul className="mt-1 space-y-0.5 font-mono text-[10px] text-muted">
                  {row.endpoints.map((ep) => (
                    <li key={ep}>· {ep}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-muted">
        Substack / Medium: no Composio toolkit yet. Product Hunt / accelerator /
        hackathon Identify: not configured (zero fabricated rows).
      </p>
    </div>
  );
}
