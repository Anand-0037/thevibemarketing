"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { Post } from "@/lib/marketing-store";

const PLATFORM_LABEL: Record<string, string> = {
  x: "X",
  linkedin: "LinkedIn",
  reddit: "Reddit",
};

function statusLabel(status: Post["status"]): string {
  switch (status) {
    case "pending":
      return "Pending HITL";
    case "queued":
      return "Queued · waiting for provider post ID";
    case "published":
      return "Published";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    default:
      return status;
  }
}

export default function QueuePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQueued, setShowQueued] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");

  const load = useCallback(async (includeQueued: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const url = includeQueued
        ? "/api/marketing/posts"
        : "/api/marketing/posts?status=pending";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load queue");
      const data = (await res.json()) as { posts: Post[] };
      const filtered = includeQueued
        ? data.posts.filter(
            (p) =>
              p.status === "pending" ||
              p.status === "queued" ||
              p.status === "published",
          )
        : data.posts;
      setPosts(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(showQueued);
  }, [load, showQueued]);

  function startEdit(item: Post) {
    setEditingId(item.id);
    setEditBody(item.body);
    setEditTitle(item.title ?? "");
  }

  async function saveEdit(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/drafts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle.trim() || null,
          body: editBody,
        }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Save failed");
      }
      const data = (await res.json()) as { post?: Post };
      if (data.post) {
        setPosts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...data.post! } : p)),
        );
      }
      setEditingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function approve(id: string) {
    setBusyId(id);
    setError(null);
    try {
      if (editingId === id) {
        const saveRes = await fetch(`/api/marketing/drafts/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editTitle.trim() || null,
            body: editBody,
          }),
        });
        if (!saveRes.ok) {
          const body = (await saveRes.json()) as { error?: string };
          throw new Error(body.error || "Save failed");
        }
        setEditingId(null);
      }
      const res = await fetch(`/api/marketing/posts/${id}/approve`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Approve failed");
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
      if (showQueued) await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(id: string) {
    setBusyId(id);
    setError(null);
    try {
      const res = await fetch(`/api/marketing/posts/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: "Rejected from HITL queue" }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error || "Reject failed");
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Marketing fleet</p>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            HITL approval queue
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Edit voice, then approve. Approve{" "}
            <span className="text-ink">queues</span> a post — it is not marked
            published until a connected provider (Reddit / X / LinkedIn) returns
            a post ID and URL.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted">
            <input
              type="checkbox"
              className="size-3.5 accent-[var(--accent)]"
              checked={showQueued}
              onChange={(e) => setShowQueued(e.target.checked)}
            />
            Include queued / published
          </label>
          <Link
            href="/app/studio"
            className="border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-accent hover:underline focus-ring"
          >
            Studio →
          </Link>
          <Link
            href="/app/connectors"
            className="font-mono text-[11px] uppercase tracking-widest text-muted hover:text-accent"
          >
            Connect Reddit / X
          </Link>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-muted">Loading queue…</p>
      ) : posts.length === 0 ? (
        <div className="panel mt-8 p-6">
          <p className="text-sm text-muted">
            Queue is empty. Generate drafts from Studio — nothing is pre-seeded.
          </p>
          <Link
            href="/app/studio"
            className="btn-primary focus-ring mt-4 inline-block !px-3 !py-1.5 text-sm"
          >
            Open Studio
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-2" aria-label="Approval queue">
          {posts.map((item) => {
            const busy = busyId === item.id;
            const editing = editingId === item.id;
            return (
              <li
                key={item.id}
                className="panel flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-xs text-accent">
                      {PLATFORM_LABEL[item.platform] ?? item.platform}
                    </p>
                    <span
                      className={`font-mono text-[10px] uppercase ${
                        item.status === "queued"
                          ? "text-warn"
                          : item.status === "published"
                            ? "text-ok"
                            : "text-muted"
                      }`}
                    >
                      {statusLabel(item.status)} · autonomy {item.autonomy}
                    </span>
                  </div>
                  {editing ? (
                    <div className="mt-2 space-y-2">
                      <input
                        className="input-field text-sm"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Title (optional)"
                        aria-label="Edit title"
                      />
                      <textarea
                        className="input-field min-h-[8rem] text-sm"
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        aria-label="Edit post body"
                      />
                    </div>
                  ) : (
                    <>
                      {item.title ? (
                        <p className="mt-1 text-sm font-medium">{item.title}</p>
                      ) : null}
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                        {item.body}
                      </p>
                    </>
                  )}
                  {item.rationale ? (
                    <p className="mt-2 font-mono text-[10px] text-muted">
                      Rationale: {item.rationale}
                    </p>
                  ) : null}
                  {item.note ? (
                    <p className="mt-1 font-mono text-[10px] text-warn">
                      {item.note}
                    </p>
                  ) : null}
                </div>
                {item.status === "pending" ? (
                  <div className="flex shrink-0 flex-col gap-2">
                    {editing ? (
                      <button
                        type="button"
                        className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
                        onClick={() => void saveEdit(item.id)}
                        disabled={busy}
                      >
                        {busy ? "Saving…" : "Save edit"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
                        onClick={() => startEdit(item)}
                        disabled={busy}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary focus-ring !px-3 !py-1.5 text-sm"
                      onClick={() => void approve(item.id)}
                      disabled={busy}
                      aria-label={`Approve ${item.platform} draft`}
                    >
                      {busy ? "Queuing…" : "Approve → queue"}
                    </button>
                    <button
                      type="button"
                      className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
                      onClick={() => void reject(item.id)}
                      disabled={busy}
                      aria-label={`Reject ${item.platform} draft`}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase ${
                      item.status === "published" ? "text-ok" : "text-warn"
                    }`}
                  >
                    {statusLabel(item.status)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
