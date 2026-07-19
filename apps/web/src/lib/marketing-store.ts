import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { dataPath } from "./paths";

export type Platform = "x" | "linkedin" | "reddit";
export type PostStatus =
  | "pending"
  | "approved"
  | "queued"
  | "rejected"
  | "published";
export type AutonomyLevel = "L1" | "L2" | "L3";
export const L3_BLOCKED_NOTE = "L3 blocked — connect Composio account";

export type BrandContext = {
  url: string;
  name: string;
  oneliner: string;
  icp: string;
  tone: string;
  pillars: string[];
  updated_at: string;
};

export type Post = {
  id: string;
  platform: Platform;
  title?: string | null;
  body: string;
  status: PostStatus;
  autonomy: AutonomyLevel;
  created_at: string;
  brand: string;
  rationale: string;
  note?: string;
};

export type LoopType = "daily_distribution" | "opportunity" | "content-draft";

export type LoopRun = {
  id: string;
  name: LoopType | string;
  started_at: string;
  finished_at?: string;
  status: "running" | "done" | "failed";
  posts_created?: number;
  note?: string;
};

export type PublishLog = {
  id: string;
  post_id: string;
  platform: Platform;
  at: string;
  via: "hitl_approve" | "l2_auto" | "l3_auto";
  /** Honest: Composio/E2B not live — stub ACT. */
  actor: "composio_stub" | "e2b_stub";
  note: string;
};

export type CampaignDay = {
  day: number;
  channel: Platform | "email" | "blog";
  goal: string;
  draft_hint: string;
};

/** Seven-day campaign brief — planning artifact; drafts still go through HITL. */
export type CampaignBrief = {
  id: string;
  title: string;
  created_at: string;
  audience: string;
  days: CampaignDay[];
  note: string;
};

export type MarketingData = {
  brand: BrandContext | null;
  posts: Post[];
  loops: LoopRun[];
  /**
   * Fleet autonomy:
   * L1 — all drafts pending HITL; approve → queued (not published until provider confirms)
   * L2 — low-risk channels may auto-queue; reddit/opportunity stay pending
   * L3 — auto only when a live Composio publish path returns a post ID/URL
   */
  autonomy: AutonomyLevel;
  publish_log: PublishLog[];
  campaign?: CampaignBrief | null;
};

function emptyData(): MarketingData {
  return {
    brand: null,
    posts: [],
    loops: [],
    autonomy: "L1",
    publish_log: [],
    campaign: null,
  };
}

/** Low-risk channels eligible for L2 auto-approve. */
export function isLowRiskPlatform(platform: Platform): boolean {
  return platform === "x" || platform === "linkedin";
}

function nowIso(): string {
  return new Date().toISOString();
}

export class MarketingStore {
  private data: MarketingData = emptyData();
  private loaded = false;

  constructor(public readonly path: string = dataPath("marketing.json")) {}

  static fromDefault(): MarketingStore {
    return new MarketingStore(dataPath("marketing.json"));
  }

  async load(): Promise<MarketingData> {
    try {
      const raw = await readFile(this.path, "utf8");
      const parsed = JSON.parse(raw) as Partial<MarketingData>;
      const autonomy =
        parsed.autonomy === "L1" ||
        parsed.autonomy === "L2" ||
        parsed.autonomy === "L3"
          ? parsed.autonomy
          : "L1";
      this.data = {
        brand: parsed.brand ?? null,
        posts: parsed.posts ?? [],
        loops: parsed.loops ?? [],
        autonomy,
        publish_log: parsed.publish_log ?? [],
        campaign: parsed.campaign ?? null,
      };
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err && "code" in err
          ? (err as { code?: string }).code
          : undefined;
      if (code === "ENOENT") {
        this.data = emptyData();
        await this.save();
      } else {
        throw err;
      }
    }
    this.loaded = true;
    return this.data;
  }

  async save(): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.${process.pid}.tmp`;
    const body = JSON.stringify(this.data, null, 2);
    await writeFile(tmp, body, "utf8");
    await writeFile(this.path, body, "utf8");
    try {
      await unlink(tmp);
    } catch {
      /* ignore */
    }
  }

  private async ensure(): Promise<void> {
    if (!this.loaded) await this.load();
  }

  async getBrand(): Promise<BrandContext | null> {
    await this.ensure();
    return this.data.brand;
  }

  async setBrand(
    brand: Omit<BrandContext, "updated_at"> & { updated_at?: string },
  ): Promise<BrandContext> {
    await this.ensure();
    const next: BrandContext = {
      url: brand.url,
      name: brand.name,
      oneliner: brand.oneliner,
      icp: brand.icp,
      tone: brand.tone,
      pillars: brand.pillars,
      updated_at: brand.updated_at ?? nowIso(),
    };
    this.data.brand = next;
    await this.save();
    return next;
  }

  async listPosts(status?: PostStatus): Promise<Post[]> {
    await this.ensure();
    const posts = [...this.data.posts].sort((a, b) =>
      b.created_at.localeCompare(a.created_at),
    );
    if (!status) return posts;
    return posts.filter((p) => p.status === status);
  }

  async listPending(): Promise<Post[]> {
    return this.listPosts("pending");
  }

  async upsertPost(
    post: Partial<Post> & { platform: Platform; body: string },
  ): Promise<Post> {
    await this.ensure();
    const brandSlug =
      post.brand ??
      this.data.brand?.name?.toLowerCase().replace(/\s+/g, "") ??
      "thevibemarketing";

    if (post.id) {
      const idx = this.data.posts.findIndex((p) => p.id === post.id);
      if (idx >= 0) {
        const merged: Post = {
          ...this.data.posts[idx],
          ...post,
          id: this.data.posts[idx].id,
          brand: brandSlug,
        };
        this.data.posts[idx] = merged;
        await this.save();
        return merged;
      }
    }

    const created: Post = {
      id: post.id ?? `mp_${randomUUID().slice(0, 8)}`,
      platform: post.platform,
      title: post.title ?? null,
      body: post.body,
      status: post.status ?? "pending",
      autonomy: post.autonomy ?? "L1",
      created_at: post.created_at ?? nowIso(),
      brand: brandSlug,
      rationale: post.rationale ?? "Manual draft",
      note: post.note,
    };
    this.data.posts.unshift(created);
    await this.save();
    return created;
  }

  async approvePost(id: string): Promise<Post | null> {
    return this.publishPost(id, "hitl_approve");
  }

  /**
   * ACT step — approve/queue only until a provider returns a confirmed post ID + URL.
   * Never marks `published` for stub/offline actors.
   */
  async publishPost(
    id: string,
    via: PublishLog["via"],
  ): Promise<Post | null> {
    await this.ensure();
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) return null;
    if (post.status === "rejected" || post.status === "published") return post;
    if (via === "l3_auto") {
      post.status = "pending";
      post.note = L3_BLOCKED_NOTE;
      await this.save();
      return post;
    }
    post.status = "queued";
    post.note =
      post.note ??
      `Approved · queued for ${post.platform}. Not published until the provider confirms a post ID/URL.`;
    const log: PublishLog = {
      id: `pub_${randomUUID().slice(0, 8)}`,
      post_id: post.id,
      platform: post.platform,
      at: nowIso(),
      via,
      actor: "composio_stub",
      note: `Queued (not published) → ${post.platform}. Connect OAuth for live social API.`,
    };
    this.data.publish_log.unshift(log);
    await this.save();
    return post;
  }

  async listPublishLog(limit = 50): Promise<PublishLog[]> {
    await this.ensure();
    return this.data.publish_log.slice(0, limit);
  }

  async rejectPost(id: string, note?: string): Promise<Post | null> {
    await this.ensure();
    const post = this.data.posts.find((p) => p.id === id);
    if (!post) return null;
    post.status = "rejected";
    if (note) post.note = note;
    await this.save();
    return post;
  }

  async addLoop(loop: LoopRun): Promise<LoopRun> {
    await this.ensure();
    this.data.loops.unshift(loop);
    await this.save();
    return loop;
  }

  async updateLoop(
    id: string,
    patch: Partial<Omit<LoopRun, "id">>,
  ): Promise<LoopRun | null> {
    await this.ensure();
    const loop = this.data.loops.find((l) => l.id === id);
    if (!loop) return null;
    Object.assign(loop, patch);
    await this.save();
    return loop;
  }

  async listLoops(): Promise<LoopRun[]> {
    await this.ensure();
    return [...this.data.loops].sort((a, b) =>
      b.started_at.localeCompare(a.started_at),
    );
  }

  async getAutonomy(): Promise<AutonomyLevel> {
    await this.ensure();
    return this.data.autonomy;
  }

  async setAutonomy(level: AutonomyLevel): Promise<AutonomyLevel> {
    await this.ensure();
    this.data.autonomy = level;
    await this.save();
    return level;
  }

  async getCampaign(): Promise<CampaignBrief | null> {
    await this.ensure();
    return this.data.campaign ?? null;
  }

  async setCampaign(campaign: CampaignBrief): Promise<CampaignBrief> {
    await this.ensure();
    this.data.campaign = campaign;
    await this.save();
    return campaign;
  }
}

let singleton: MarketingStore | null = null;

export function getMarketingStore(): MarketingStore {
  if (!singleton) singleton = MarketingStore.fromDefault();
  return singleton;
}

/** Heuristic brand extract when Firecrawl is offline — used by /api/brand. */
export function heuristicBrandFromUrl(
  url: string,
  markdown?: string | null,
): Omit<BrandContext, "updated_at"> {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    /* keep */
  }
  const name = host.split(".")[0] || "product";
  const isSelf =
    /thevibemarketing/i.test(host) ||
    /thevibemarketing/i.test(url) ||
    /vibemarketer\.fun/i.test(host) ||
    /vibemarketer/i.test(url);
  const isOperator =
    /0xanand\.tech/i.test(host) ||
    /anand\s*vashishtha/i.test(markdown ?? "") ||
    /AnandVashisht15/i.test(markdown ?? "");
  const excerpt = markdown?.slice(0, 400);

  if (isSelf || isOperator) {
    return {
      url: isSelf ? url : "https://vibemarketer.fun",
      name: "thevibemarketing",
      oneliner:
        "Autonomous AI agent fleet for SaaS marketing — Cursor for marketing. Built by Anand Vashishtha (0xanand.tech).",
      icp: "Solo SaaS founders and small technical teams who ship fast but lack distribution — especially AI/Web3 builders",
      tone: "direct/technical, founder-native, no agency fluff — Anand's builder voice",
      pillars: [
        "distribution is the scarce asset",
        "HITL brand safety",
        "persistent brand memory",
        "agentic loops not chat assistants",
        "dogfood: Anand Vashishtha · @AnandVashisht15 · 0xanand.tech",
      ],
    };
  }

  const text = `${host} ${markdown ?? ""}`;
  const tech =
    /api|sdk|developer|infra|agent|openai|github|saas|devtools/i.test(text) ||
    /dev|api|ai|ml/.test(host);
  const localMsme =
    /salon|clinic|restaurant|cafe|bakery|plumber|dentist|lawyer|real.?estate|gym|boutique|shop|store|hotel|spa|garage|contractor|accountant|agency|studio|local|msme|smb|small.?business|google.?business/i.test(
      text,
    );

  if (localMsme && !tech) {
    return {
      url,
      name,
      oneliner: excerpt
        ? `${name} — ${excerpt.slice(0, 120)}`
        : `${name} — local / MSME brand that needs steady social presence.`,
      icp: "Local MSMEs, service businesses, and small teams who need on-brand posts without an agency",
      tone: "clear/friendly, neighborhood-credible, no jargon",
      pillars: [
        "local trust & proof",
        "offers & updates",
        "community / reviews",
        "consistent cadence",
      ],
    };
  }

  return {
    url,
    name,
    oneliner: excerpt
      ? `${name} — ${excerpt.slice(0, 120)}`
      : `${name} — product for founders and small teams who need distribution.`,
    icp: tech
      ? "Solo SaaS founders, early startups, and technical GTM leads"
      : "SaaS founders, MSMEs, and small brands seeking owned distribution",
    tone: tech ? "direct/technical" : "clear/founder-led",
    pillars: tech
      ? ["product-led growth", "community", "content"]
      : ["thought leadership", "pipeline", "community", "local trust"],
  };
}
