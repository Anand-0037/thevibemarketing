/**
 * Postgres dual path for production:
 *   USE_POSTGRES_DUAL=1
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (server only — never NEXT_PUBLIC)
 *
 * Workspaces are owned by auth.users.id — never a shared null-owner fund.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Founder, Product, Signal, StoreData } from "@vibe/engine";
import { getWorkspaceOwnerId } from "./workspace-context";

function dualEnabled(): boolean {
  return (
    process.env.USE_POSTGRES_DUAL === "1" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim())
  );
}

let admin: SupabaseClient | null = null;
const workspaceByOwner = new Map<string, string>();

function getAdmin(): SupabaseClient | null {
  if (!dualEnabled()) return null;
  if (admin) return admin;
  admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return admin;
}

function resolveOwnerId(): string | null {
  const fromCtx = getWorkspaceOwnerId()?.trim();
  if (fromCtx && fromCtx !== "local-bypass") return fromCtx;
  const envOwner = process.env.VC_BRAIN_OWNER_ID?.trim();
  if (envOwner) return envOwner;
  return null;
}

async function ensureWorkspace(sb: SupabaseClient): Promise<string | null> {
  const ownerId = resolveOwnerId();
  if (!ownerId) {
    console.error(
      "[postgres-dual] refusing workspace without owner_id (set auth context)",
    );
    return null;
  }

  const cached = workspaceByOwner.get(ownerId);
  if (cached) return cached;

  const envWs = process.env.VC_BRAIN_WORKSPACE_ID?.trim();
  if (envWs) {
    workspaceByOwner.set(ownerId, envWs);
    return envWs;
  }

  const { data: existing } = await sb
    .from("workspaces")
    .select("id")
    .eq("kind", "fund")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    workspaceByOwner.set(ownerId, existing.id as string);
    return existing.id as string;
  }

  const { data: created, error } = await sb
    .from("workspaces")
    .insert({
      kind: "fund",
      name: "VC Brain",
      owner_id: ownerId,
    })
    .select("id")
    .single();
  if (error || !created?.id) {
    console.error("[postgres-dual] workspace:", error?.message);
    return null;
  }
  workspaceByOwner.set(ownerId, created.id as string);
  return created.id as string;
}

function contentHash(source: string, url: string | undefined, payload: unknown): string {
  return createHash("sha256")
    .update(source)
    .update("|")
    .update(url ?? "")
    .update("|")
    .update(JSON.stringify(payload ?? {}))
    .digest("hex")
    .slice(0, 32);
}

export async function dualWriteSignal(signal: Signal): Promise<void> {
  const sb = getAdmin();
  if (!sb) return;
  const ws = await ensureWorkspace(sb);
  if (!ws) return;
  const { error } = await sb.from("signals").upsert(
    {
      workspace_id: ws,
      entity_type: signal.entity_type,
      entity_id: signal.entity_id,
      source: signal.source,
      url: signal.url ?? null,
      payload: signal.payload,
      content_hash: contentHash(signal.source, signal.url, signal.payload),
      observed_at: signal.observed_at,
      ingested_at: signal.ingested_at,
    },
    { onConflict: "workspace_id,entity_id,source,content_hash", ignoreDuplicates: true },
  );
  if (error) throw new Error(`[postgres-dual] signal: ${error.message}`);
}

export async function dualWriteFounder(
  founder: Founder,
  opts?: { trigger?: string; pipeline_run_id?: string; prev_score?: number },
): Promise<void> {
  const sb = getAdmin();
  if (!sb) return;
  const ws = await ensureWorkspace(sb);
  if (!ws) return;

  const { error: upErr } = await sb.from("founders").upsert(
    {
      id: founder.id,
      workspace_id: ws,
      name: founder.name,
      handles: founder.handles,
      links: founder.links,
      bio: founder.bio ?? null,
      founder_score: founder.founder_score,
      score_confidence: founder.score_confidence,
      gravity: founder.gravity,
      activation: founder.activation ?? null,
      created_at: founder.created_at,
      updated_at: founder.updated_at,
    },
    { onConflict: "workspace_id,id" },
  );
  if (upErr) throw new Error(`[postgres-dual] founder: ${upErr.message}`);

  const prev = opts?.prev_score;
  const delta =
    typeof prev === "number"
      ? Math.abs(founder.founder_score - prev)
      : Number.POSITIVE_INFINITY;
  if (delta < 0.5) return;

  const { error: evErr } = await sb.from("founder_score_events").insert({
    workspace_id: ws,
    founder_id: founder.id,
    score: founder.founder_score,
    confidence: founder.score_confidence,
    gravity_score: founder.gravity?.gravity_score ?? null,
    trigger: opts?.trigger ?? "upsert",
    pipeline_run_id: opts?.pipeline_run_id ?? null,
    rationale: founder.gravity?.evidence?.[0] ?? null,
    at: founder.updated_at,
  });
  if (evErr) throw new Error(`[postgres-dual] score_event: ${evErr.message}`);
}

export function isPostgresDualEnabled(): boolean {
  return dualEnabled();
}

function emptyGravity() {
  return {
    gravity_score: 0,
    confidence: 0,
    components: {
      velocity: 0,
      pull_ratio: 0,
      cadence: 0,
      stars: 0,
      forks: 0,
      hn_points: 0,
      followers: 0,
      engagement: 0,
      post_count: 0,
      shipping_events: 0,
      audience: 1,
      external_engagement: 0,
      own_output: 1,
    },
    evidence: [] as string[],
    abstain: true as const,
    abstain_reason: "Not yet scored",
  };
}

/** Pull durable Memory from the caller's owned workspace. */
export async function fetchStoreBundleFromPostgres(): Promise<StoreData | null> {
  const sb = getAdmin();
  if (!sb) return null;
  const ws = await ensureWorkspace(sb);
  if (!ws) return null;

  const [{ data: founders, error: fErr }, { data: products, error: pErr }, { data: signals, error: sErr }] =
    await Promise.all([
      sb.from("founders").select("*").eq("workspace_id", ws).order("founder_score", { ascending: false }),
      sb.from("products").select("*").eq("workspace_id", ws),
      sb
        .from("signals")
        .select("*")
        .eq("workspace_id", ws)
        .order("observed_at", { ascending: false })
        .limit(2000),
    ]);

  if (fErr) {
    console.error("[postgres-dual] hydrate founders:", fErr.message);
    return null;
  }
  if (pErr) console.error("[postgres-dual] hydrate products:", pErr.message);
  if (sErr) console.error("[postgres-dual] hydrate signals:", sErr.message);
  if (!founders?.length) return null;

  const mappedFounders: Founder[] = founders.map((row) => {
    const g = (row.gravity ?? {}) as Founder["gravity"];
    return {
      id: row.id as string,
      name: row.name as string,
      handles: (row.handles ?? {}) as Founder["handles"],
      links: (row.links ?? []) as string[],
      bio: (row.bio as string | null) ?? undefined,
      claims: [],
      founder_score: Number(row.founder_score ?? 0),
      score_confidence: Number(row.score_confidence ?? 0),
      gravity: g && typeof g.gravity_score === "number" ? g : emptyGravity(),
      activation: (row.activation as Founder["activation"]) ?? undefined,
      created_at: (row.created_at as string) ?? new Date().toISOString(),
      updated_at: (row.updated_at as string) ?? new Date().toISOString(),
    };
  });

  const mappedProducts: Product[] = (products ?? []).map((row) => ({
    id: row.id as string,
    founder_id: row.founder_id as string,
    name: row.name as string,
    domain: (row.domain as string | null) ?? undefined,
    oneliner: (row.oneliner as string | null) ?? undefined,
    sector: (row.sector as string | null) ?? undefined,
    stage: (row.stage as string | null) ?? undefined,
    traction_claims: (row.traction_claims as Product["traction_claims"]) ?? [],
  }));

  const mappedSignals: Signal[] = (signals ?? []).map((row) => ({
    id: row.id as string,
    entity_type: row.entity_type as Signal["entity_type"],
    entity_id: row.entity_id as string,
    source: row.source as string,
    url: (row.url as string | null) ?? undefined,
    payload: (row.payload ?? {}) as Record<string, unknown>,
    observed_at: row.observed_at as string,
    ingested_at: row.ingested_at as string,
  }));

  return {
    founders: mappedFounders,
    products: mappedProducts,
    signals: mappedSignals,
    thesis: null,
    screenings: [],
    memos: [],
    traces: [],
  };
}
