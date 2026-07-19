import {
  MemoryStore,
  type Founder,
  type Memo,
  type Product,
  type Screening,
  type Signal,
  type StoreData,
  type Thesis,
  type TraceStep,
} from "@vibe/engine";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  dualWriteFounder,
  dualWriteMemo,
  dualWriteProduct,
  dualWriteScreening,
  dualWriteSignal,
  dualWriteThesis,
  dualWriteTrace,
  fetchStoreBundleFromPostgres,
  isPostgresDualEnabled,
} from "./postgres-dual";
import { projectRoot } from "./paths";
import { getWorkspaceOwnerId } from "./workspace-context";

function dualWriteFailClosed(): boolean {
  // When dual-write is on, never report success if Postgres failed.
  // Opt out only with DUAL_WRITE_FAIL_CLOSED=0 (local debugging).
  if (!isPostgresDualEnabled()) return false;
  if (process.env.DUAL_WRITE_FAIL_CLOSED === "0") return false;
  return true;
}

async function runDualWrite(
  label: string,
  fn: () => Promise<void>,
): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error(`[store] ${label}`, e);
    if (dualWriteFailClosed()) throw e;
  }
}

/**
 * Per-owner MemoryStore. On Vercel, cache under /tmp; Postgres is durable.
 */
class DualMemoryStore extends MemoryStore {
  private pgHydrated = false;

  override async load(): Promise<StoreData> {
    const local = await super.load();
    // Re-hydrate when empty — Vercel routes hit different instances; /tmp is not shared.
    if (this.pgHydrated && local.founders.length > 0) {
      return local;
    }
    const bundle = await fetchStoreBundleFromPostgres();
    this.pgHydrated = true;
    if (
      bundle &&
      (bundle.founders.length ||
        bundle.products.length ||
        bundle.screenings.length ||
        bundle.memos.length ||
        bundle.thesis)
    ) {
      // Keep warm JSON opportunity data if Postgres hydrate is still catching up
      // (migration lag / first dual-write after enable).
      const founderIds = new Set(bundle.founders.map((f) => f.id));
      const founders = bundle.founders.map((f) => {
        if (f.claims?.length) return f;
        const loc = local.founders.find((lf) => lf.id === f.id);
        return loc?.claims?.length ? { ...f, claims: loc.claims } : f;
      });
      const products =
        bundle.products.length > 0
          ? bundle.products
          : local.products.filter((p) => founderIds.has(p.founder_id));
      const merged: StoreData = {
        ...bundle,
        founders: founders.length ? founders : local.founders,
        products,
        screenings: bundle.screenings.length
          ? bundle.screenings
          : local.screenings.filter((s) => founderIds.has(s.founder_id)),
        memos: bundle.memos.length
          ? bundle.memos
          : local.memos.filter((m) => founderIds.has(m.founder_id)),
        traces: bundle.traces.length ? bundle.traces : local.traces,
        thesis: bundle.thesis ?? local.thesis,
      };
      await this.replaceAll(merged);
      console.info(
        `[store] Hydrated ${merged.founders.length} founders · ${merged.products.length} products from Postgres`,
      );
      return merged;
    }
    return local;
  }

  override async addSignal(
    signal: Omit<Signal, "id" | "ingested_at"> & {
      id?: string;
      ingested_at?: string;
    },
  ): Promise<Signal> {
    const saved = await super.addSignal(signal);
    await runDualWrite("dualWriteSignal", () => dualWriteSignal(saved));
    return saved;
  }

  override async upsertFounder(
    founder: Partial<Founder> & { name: string },
  ): Promise<Founder> {
    let prev: number | undefined;
    try {
      const id = founder.id;
      if (id) {
        const existing = (await this.load()).founders.find((f) => f.id === id);
        prev = existing?.founder_score;
      }
    } catch {
      /* ignore */
    }
    const saved = await super.upsertFounder(founder);
    await runDualWrite("dualWriteFounder", () =>
      dualWriteFounder(saved, {
        trigger: "upsert",
        prev_score: prev,
      }),
    );
    return saved;
  }

  override async upsertProduct(
    product: Partial<Product> & { name: string; founder_id: string },
  ): Promise<Product> {
    const saved = await super.upsertProduct(product);
    await runDualWrite("dualWriteProduct", () => dualWriteProduct(saved));
    return saved;
  }

  override async saveScreening(screening: Screening): Promise<Screening> {
    const saved = await super.saveScreening(screening);
    await runDualWrite("dualWriteScreening", () => dualWriteScreening(saved));
    return saved;
  }

  override async saveMemo(memo: Memo): Promise<Memo> {
    const saved = await super.saveMemo(memo);
    await runDualWrite("dualWriteMemo", () => dualWriteMemo(saved));
    return saved;
  }

  override async addTrace(step: TraceStep): Promise<TraceStep> {
    const saved = await super.addTrace(step);
    await runDualWrite("dualWriteTrace", () => dualWriteTrace(saved));
    return saved;
  }

  override async setThesis(thesis: Thesis): Promise<Thesis> {
    const saved = await super.setThesis(thesis);
    await runDualWrite("dualWriteThesis", () => dualWriteThesis(saved));
    return saved;
  }
}

const singletons = new Map<string, MemoryStore>();

function storeKey(): string {
  return getWorkspaceOwnerId()?.trim() || "anonymous";
}

function storePath(key: string): string {
  const safe = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  // Serverless: writable /tmp. Local: repo data/stores.
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return join(tmpdir(), "vibemarketer-stores", `${safe}.json`);
  }
  return join(projectRoot(), "data", "stores", `${safe}.json`);
}

export function getStore(): MemoryStore {
  const key = storeKey();
  let store = singletons.get(key);
  if (!store) {
    const path = storePath(key);
    store = isPostgresDualEnabled()
      ? new DualMemoryStore(path)
      : new MemoryStore(path);
    if (isPostgresDualEnabled()) {
      console.info(`[store] Postgres dual-write + hydrate ON · owner=${key}`);
    }
    singletons.set(key, store);
  }
  return store;
}
