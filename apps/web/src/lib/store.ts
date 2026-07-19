import { MemoryStore, type Founder, type Signal, type StoreData } from "@vibe/engine";
import {
  dualWriteFounder,
  dualWriteSignal,
  fetchStoreBundleFromPostgres,
  isPostgresDualEnabled,
} from "./postgres-dual";
import { projectRoot } from "./paths";
import { getWorkspaceOwnerId } from "./workspace-context";

/**
 * Per-owner MemoryStore. Dual-writes await Supabase so callers see durable success.
 */
class DualMemoryStore extends MemoryStore {
  private pgHydrated = false;

  override async load(): Promise<StoreData> {
    const data = await super.load();
    if (this.pgHydrated) return data;
    this.pgHydrated = true;
    if (data.founders.length > 0) return data;

    const bundle = await fetchStoreBundleFromPostgres();
    if (!bundle?.founders.length) return data;

    await this.replaceAll(bundle);
    console.info(
      `[store] Hydrated ${bundle.founders.length} founders from Postgres`,
    );
    return super.load();
  }

  override async addSignal(
    signal: Omit<Signal, "id" | "ingested_at"> & {
      id?: string;
      ingested_at?: string;
    },
  ): Promise<Signal> {
    const saved = await super.addSignal(signal);
    await dualWriteSignal(saved);
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
    await dualWriteFounder(saved, {
      trigger: "upsert",
      prev_score: prev,
    });
    return saved;
  }
}

const singletons = new Map<string, MemoryStore>();

function storeKey(): string {
  return getWorkspaceOwnerId()?.trim() || "anonymous";
}

export function getStore(): MemoryStore {
  const key = storeKey();
  let store = singletons.get(key);
  if (!store) {
    const path = `${projectRoot()}/data/stores/${key}.json`;
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
