"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  MarketingPageHero,
  MarketingSection,
} from "@/components/MarketingPage";
import { ScoreBar } from "@/components/ScoreBar";
import { DOGFOOD_OPERATOR } from "@/content/dogfood-operator";
import { demoDefaultsEnabled } from "@/lib/demo";

const DEMO = demoDefaultsEnabled();

type Enrichment = {
  github_token?: boolean;
  firecrawl?: boolean;
  tavily?: boolean;
  steps?: string[];
  search_hits?: Array<{ kind: string; label: string; url: string }>;
};

type AuditResult = {
  ok: boolean;
  disclaimer?: string;
  source?: string;
  resolved?: Record<string, unknown>;
  enrichment?: Enrichment;
  gravity_score?: number;
  confidence?: number;
  abstain?: boolean;
  abstain_reason?: string | null;
  components?: {
    velocity: number;
    pull_ratio: number;
    cadence: number;
    stars: number;
    forks: number;
    hn_points: number;
    followers: number;
    engagement: number;
    audience: number;
  };
  evidence?: string[];
  cold_start_note?: string;
  error?: string;
  hint?: string;
};

export default function GravityAuditPage() {
  const [input, setInput] = useState(
    DEMO
      ? `${DOGFOOD_OPERATOR.github_login}\n${DOGFOOD_OPERATOR.product.repo.replace("https://github.com/", "")}`
      : "",
  );
  const [stars, setStars] = useState("");
  const [hn, setHn] = useState("");
  const [followers, setFollowers] = useState(
    DEMO ? String(DOGFOOD_OPERATOR.github_stats.followers) : "",
  );
  const [deep, setDeep] = useState(true);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function runAudit() {
    setError(null);
    startTransition(async () => {
      try {
        const body: Record<string, unknown> = {
          input: input.trim(),
          deep,
        };
        if (stars.trim()) body.stars = Number(stars);
        if (hn.trim()) body.hn_points = Number(hn);
        if (followers.trim()) body.followers = Number(followers);

        const res = await fetch("/api/tools/gravity-audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const { readJsonSafe } = await import("@/lib/safe-json");
        const { data } = await readJsonSafe<AuditResult>(res);
        if (!res.ok || data?.error) {
          setResult(null);
          setError(
            [data?.error, data?.hint].filter(Boolean).join(" — ") ||
              `Request failed (${res.status})`,
          );
          return;
        }
        if (!data) {
          setResult(null);
          setError(`Request failed (${res.status})`);
          return;
        }
        setResult(data);
      } catch (e) {
        setResult(null);
        setError(e instanceof Error ? e.message : "Audit failed");
      }
    });
  }

  return (
    <>
      <MarketingPageHero
        narrow
        label="Free tool · Phase 1"
        title="Distribution Gravity Audit"
        lead={
          <>
            Paste a GitHub username,{" "}
            <span className="text-ink">owner/repo</span>, or product name — we
            search public GitHub + HN, optionally Firecrawl/Tavily — then score
            with the same deterministic gravity math as VC Brain.
          </>
        }
        actions={
          <Link href="/vc-brain" className="btn-ghost focus-ring text-base">
            See VC Brain
          </Link>
        }
      >
        <p className="border-l-2 border-accent/50 pl-3 text-sm text-muted">
          Not investment advice. Scores come from public-signal math — no LLM
          inventing numbers. Product names resolve via GitHub search (e.g.
          kaggleingest → Anand-0037/KaggleIngest).
        </p>
      </MarketingPageHero>

      <MarketingSection flush>
      <form
        className="panel max-w-2xl space-y-5 p-6 sm:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          runAudit();
        }}
      >
        <div>
          <label htmlFor="audit-input" className="section-label mb-2 block">
            GitHub or public signals
          </label>
          <textarea
            id="audit-input"
            className="input-field min-h-[110px] font-mono text-sm"
            placeholder={`${DOGFOOD_OPERATOR.github_login}\n${DOGFOOD_OPERATOR.github_login}/thevibemarketing\nthevibemarketing`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted">
            Exact username, owner/repo, product name (public search), or free-text
            signal numbers.
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="mt-1"
            checked={deep}
            onChange={(e) => setDeep(e.target.checked)}
          />
          <span>
            Deep public search — GitHub search + HN Algolia
            {"; "}
            Firecrawl + Tavily when those research providers are configured on
            the server
          </span>
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="stars" className="mb-1 block text-xs text-muted">
              Stars (optional)
            </label>
            <input
              id="stars"
              type="number"
              min={0}
              className="input-field font-mono text-sm"
              value={stars}
              onChange={(e) => setStars(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="hn" className="mb-1 block text-xs text-muted">
              HN points (optional)
            </label>
            <input
              id="hn"
              type="number"
              min={0}
              className="input-field font-mono text-sm"
              value={hn}
              onChange={(e) => setHn(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label htmlFor="followers" className="mb-1 block text-xs text-muted">
              Followers (optional)
            </label>
            <input
              id="followers"
              type="number"
              min={0}
              className="input-field font-mono text-sm"
              value={followers}
              onChange={(e) => setFollowers(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="btn-primary focus-ring" disabled={pending}>
            {pending ? "Scoring…" : "Run audit"}
          </button>
        </div>
      </form>

      {error ? (
        <div className="panel mt-6 max-w-2xl border-danger/40 p-4 text-sm text-danger" role="alert">
          {error}
        </div>
      ) : null}

      {result?.ok && result.gravity_score != null ? (
        <div className="mt-10 max-w-2xl space-y-6">
          <div className="panel p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="section-label">Gravity score</p>
              <span className="font-mono text-[10px] uppercase tracking-widest text-accent">
                {result.source ?? "public signals"}
              </span>
            </div>
            <p className="mt-2 font-display text-5xl font-bold tracking-tight text-accent tabular-nums">
              {result.gravity_score.toFixed(0)}
              <span className="text-2xl text-muted">/100</span>
            </p>
            <div className="mt-4">
              <ScoreBar
                value={result.gravity_score}
                label="Distribution gravity"
                tone={result.abstain ? "warn" : "accent"}
              />
            </div>
            <p className="mt-3 font-mono text-xs tabular-nums text-muted">
              Confidence {(Number(result.confidence ?? 0) * 100).toFixed(0)}%
              {result.abstain
                ? ` · abstain${result.abstain_reason ? `: ${result.abstain_reason}` : ""}`
                : ""}
            </p>
            {result.cold_start_note ? (
              <p className="mt-4 text-sm leading-relaxed text-ink/90">
                {result.cold_start_note}
              </p>
            ) : null}
            {result.disclaimer ? (
              <p className="mt-3 text-xs text-muted/80">{result.disclaimer}</p>
            ) : null}
          </div>

          {result.components ? (
            <div className="panel p-6">
              <p className="section-label mb-4">Components</p>
              <ul className="grid gap-3 sm:grid-cols-2">
                <li>
                  <ScoreBar
                    value={Math.min(100, result.components.velocity * 20)}
                    label={`Velocity ${result.components.velocity.toFixed(2)}`}
                    tone="cool"
                    showValue={false}
                  />
                </li>
                <li>
                  <ScoreBar
                    value={Math.min(100, result.components.pull_ratio * 10)}
                    label={`Pull ratio ${result.components.pull_ratio.toFixed(2)}`}
                    tone="cool"
                    showValue={false}
                  />
                </li>
                <li>
                  <ScoreBar
                    value={result.components.cadence * 100}
                    label={`Cadence ${(result.components.cadence * 100).toFixed(0)}%`}
                    tone="ok"
                  />
                </li>
                <li className="font-mono text-xs text-muted sm:col-span-2">
                  stars {result.components.stars} · forks {result.components.forks} · HN{" "}
                  {result.components.hn_points} · followers{" "}
                  {result.components.followers} · engagement{" "}
                  {result.components.engagement}
                </li>
              </ul>
            </div>
          ) : null}

          {result.enrichment ? (
            <div className="panel p-6">
              <p className="section-label mb-3">Enrichment</p>
              <p className="font-mono text-[11px] text-muted">
                GITHUB_TOKEN {result.enrichment.github_token ? "on" : "off"} ·
                FIRECRAWL {result.enrichment.firecrawl ? "on" : "off"} · TAVILY{" "}
                {result.enrichment.tavily ? "on" : "off"}
              </p>
              {result.enrichment.search_hits?.length ? (
                <ul className="mt-3 space-y-1 text-sm text-muted">
                  {result.enrichment.search_hits.map((h) => (
                    <li key={h.url}>
                      <span className="font-mono text-[10px] uppercase text-accent">
                        {h.kind}
                      </span>{" "}
                      <a
                        href={h.url}
                        target="_blank"
                        rel="noreferrer"
                        className="focus-ring break-all text-accent hover:underline"
                      >
                        {h.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}
              {result.enrichment.steps?.length ? (
                <ol className="mt-3 list-decimal space-y-1 pl-5 font-mono text-[11px] text-muted">
                  {result.enrichment.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              ) : null}
            </div>
          ) : null}

          {result.evidence?.length ? (
            <div className="panel p-6">
              <p className="section-label mb-3">Evidence</p>
              <ul className="list-disc space-y-1.5 pl-5 break-words text-sm text-muted">
                {result.evidence.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="text-sm text-muted">
            Want the full pipeline (thesis fit, trust, $100K memo)?{" "}
            <Link href="/app/radar" className="text-accent hover:underline focus-ring">
              Open the VC Brain radar
            </Link>
            .
          </p>

          <div className="flex flex-wrap gap-3 border-t border-line pt-6">
            <Link href="/app/compare" className="btn-primary focus-ring !px-3 !py-1.5 text-sm">
              See the inversion
            </Link>
            <Link href="/vc-brain" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
              Explore VC Brain
            </Link>
          </div>
        </div>
      ) : null}
      </MarketingSection>
    </>
  );
}
