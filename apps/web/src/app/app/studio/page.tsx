"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type {
  AutonomyLevel,
  BrandContext,
  LoopRun,
  Post,
} from "@/lib/marketing-store";

const PLATFORM_LABEL: Record<string, string> = {
  x: "X",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

const AUTONOMY_LEVELS: AutonomyLevel[] = ["L1", "L2", "L3"];

const AUTONOMY_HINT: Record<AutonomyLevel, string> = {
  L1: "Every draft pending HITL → approve queues publish (needs connected account)",
  L2: "X/LinkedIn daily auto-queue when connected; Reddit/opportunity stay pending",
  L3: "All new drafts auto-queue when connected — HITL still available",
};

export default function StudioPage() {
  const [brand, setBrand] = useState<BrandContext | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loops, setLoops] = useState<LoopRun[]>([]);
  const [autonomy, setAutonomy] = useState<AutonomyLevel>("L1");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loopBusy, setLoopBusy] = useState<string | null>(null);
  const [savingAutonomy, setSavingAutonomy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandRes, postsRes, autonomyRes, loopsRes] = await Promise.all([
        fetch("/api/marketing/brand"),
        fetch("/api/marketing/posts"),
        fetch("/api/marketing/autonomy"),
        fetch("/api/marketing/loops"),
      ]);
      if (!brandRes.ok || !postsRes.ok) throw new Error("Failed to load studio");
      const brandData = (await brandRes.json()) as { brand: BrandContext | null };
      const postsData = (await postsRes.json()) as { posts: Post[] };
      setBrand(brandData.brand);
      setPosts(postsData.posts.slice(0, 12));
      if (autonomyRes.ok) {
        const a = (await autonomyRes.json()) as { autonomy: AutonomyLevel };
        setAutonomy(a.autonomy);
      }
      if (loopsRes.ok) {
        const l = (await loopsRes.json()) as { loops: LoopRun[] };
        setLoops(l.loops.slice(0, 6));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate() {
    setGenerating(true);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/marketing/draft", { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Draft generation failed");
      }
      setBanner("Generated 3 template drafts (offline templates).");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Draft generation failed");
    } finally {
      setGenerating(false);
    }
  }

  async function runLoop(type: "daily_distribution" | "opportunity") {
    setLoopBusy(type);
    setError(null);
    setBanner(null);
    try {
      const res = await fetch("/api/marketing/loops/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Loop failed");
      }
      const data = (await res.json()) as {
        posts: Post[];
        auto_published?: number;
        stub?: boolean;
      };
      const label =
        type === "daily_distribution"
          ? "Daily Distribution Loop"
          : "Opportunity Loop";
      const autoPublished = data.auto_published ?? 0;
      const pendingCount = data.posts.length - autoPublished;
      let message = `${label} created ${data.posts.length} draft${data.posts.length === 1 ? "" : "s"} (templates).`;
      if (autoPublished > 0) {
        message += ` ${autoPublished} auto-published under autonomy dial.`;
      }
      if (pendingCount > 0) {
        message += ` ${pendingCount} pending — review in HITL queue.`;
      } else if (autoPublished === 0) {
        message += " Review in HITL queue.";
      }
      setBanner(message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Loop failed");
    } finally {
      setLoopBusy(null);
    }
  }

  async function saveAutonomy(level: AutonomyLevel) {
    setSavingAutonomy(true);
    setError(null);
    try {
      const res = await fetch("/api/marketing/autonomy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autonomy: level }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Failed to save autonomy");
      }
      const data = (await res.json()) as { autonomy: AutonomyLevel };
      setAutonomy(data.autonomy);
      setBanner(
        `Autonomy set to ${data.autonomy}. Next loop run will respect the dial.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save autonomy");
    } finally {
      setSavingAutonomy(false);
    }
  }

  const busy = generating || loopBusy !== null;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Marketing fleet</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Studio
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Brand context in, drafts out. Run distribution or opportunity loops,
            then send everything to the HITL queue before anything publishes.
          </p>
        </div>
        <button
          type="button"
          className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
          onClick={() => void generate()}
          disabled={busy}
          aria-busy={generating}
        >
          {generating ? "Generating…" : "Generate 3 drafts"}
        </button>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {banner ? (
        <p className="mt-4 text-sm text-accent" role="status">
          {banner}
        </p>
      ) : null}

      <section className="panel mt-8 p-4" aria-label="Agentic loops">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Agentic loops
        </p>
        <p className="mt-1 text-sm text-muted">
          Template drafts — offline when no model key. Posts land
          as pending for HITL.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
            onClick={() => void runLoop("daily_distribution")}
            disabled={busy}
            aria-busy={loopBusy === "daily_distribution"}
          >
            {loopBusy === "daily_distribution"
              ? "Running…"
              : "Run Daily Distribution Loop"}
          </button>
          <button
            type="button"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            onClick={() => void runLoop("opportunity")}
            disabled={busy}
            aria-busy={loopBusy === "opportunity"}
          >
            {loopBusy === "opportunity"
              ? "Running…"
              : "Run Opportunity Loop"}
          </button>
        </div>
        {loops.length > 0 ? (
          <ul className="mt-4 space-y-1 font-mono text-[11px] text-muted">
            {loops.map((loop) => (
              <li key={loop.id}>
                {loop.name} · {loop.status}
                {typeof loop.posts_created === "number"
                  ? ` · ${loop.posts_created} posts`
                  : ""}
                {" · "}
                {new Date(loop.started_at).toLocaleString()}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel mt-4 p-4" aria-label="Autonomy dial">
        <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
          Autonomy dial
        </p>
        <p className="mt-1 text-sm text-muted">{AUTONOMY_HINT[autonomy]}</p>
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Autonomy level"
        >
          {AUTONOMY_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              className={
                autonomy === level
                  ? "btn-primary focus-ring !px-3 !py-1.5 text-sm"
                  : "btn-ghost focus-ring !px-3 !py-1.5 text-sm"
              }
              onClick={() => void saveAutonomy(level)}
              disabled={savingAutonomy}
              aria-pressed={autonomy === level}
            >
              {level}
            </button>
          ))}
        </div>
        <p className="mt-2 font-mono text-[10px] text-muted">
          Saves to marketing.json. Next Studio loop run respects the dial (L2/L3 auto-queue when connected).
        </p>
      </section>

      <section className="panel mt-8 p-4" aria-label="Brand context">
        {loading && !brand ? (
          <p className="text-sm text-muted">Loading brand…</p>
        ) : brand ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-accent">
              Brand context
            </p>
            <h2 className="mt-1 font-display text-xl font-bold">{brand.name}</h2>
            <p className="mt-1 text-sm text-muted">{brand.oneliner}</p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-mono text-[10px] uppercase text-muted">ICP</dt>
                <dd>{brand.icp}</dd>
              </div>
              <div>
                <dt className="font-mono text-[10px] uppercase text-muted">Tone</dt>
                <dd>{brand.tone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-[10px] uppercase text-muted">
                  Pillars
                </dt>
                <dd className="mt-1 flex flex-wrap gap-2">
                  {brand.pillars.map((p: string) => (
                    <span
                      key={p}
                      className="border border-line px-2 py-0.5 font-mono text-[11px] text-muted"
                    >
                      {p}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <p className="mt-3 min-w-0 font-mono text-[10px] text-muted">
              <a
                href={brand.url}
                className="break-all text-accent hover:underline focus-ring"
                target="_blank"
                rel="noreferrer"
              >
                {brand.url}
              </a>
              {" · "}updated {new Date(brand.updated_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm text-muted">
              No brand context yet. Run onboarding to extract voice, ICP, and
              pillars — then generate drafts here.
            </p>
            <Link
              href="/app/onboarding"
              className="btn-ghost focus-ring mt-4 inline-flex !px-3 !py-1.5 text-sm"
            >
              Go to onboarding
            </Link>
          </div>
        )}
      </section>

      <section className="mt-8" aria-label="Recent drafts">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Recent drafts</h2>
          <Link
            href="/app/queue"
            className="font-mono text-[11px] uppercase tracking-widest text-accent hover:underline focus-ring"
          >
            Open HITL queue →
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-muted">Loading drafts…</p>
        ) : posts.length === 0 ? (
          <div>
            <p className="text-sm text-muted">
              No drafts yet. Run a loop, generate drafts, or seed the queue.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
                disabled={!!loopBusy || generating}
                onClick={() => void runLoop("daily_distribution")}
              >
                {loopBusy === "daily_distribution"
                  ? "Running…"
                  : "Run Daily Distribution"}
              </button>
              <button
                type="button"
                className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
                disabled={generating || !!loopBusy}
                onClick={() => void generate()}
              >
                {generating ? "Generating…" : "Generate drafts"}
              </button>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {posts.map((post) => (
              <li key={post.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
                    {PLATFORM_LABEL[post.platform] ?? post.platform}
                  </span>
                  <span className="font-mono text-[10px] uppercase text-muted">
                    {post.status} · autonomy {post.autonomy}
                  </span>
                </div>
                {post.title ? (
                  <p className="mt-2 text-sm font-medium">{post.title}</p>
                ) : null}
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted line-clamp-4">
                  {post.body}
                </p>
                {post.note ? (
                  <p className="mt-2 font-mono text-[10px] text-warn">
                    {post.note}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
