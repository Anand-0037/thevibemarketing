import { randomUUID } from "node:crypto";
import {
  completeJsonDetailed,
  recallBrandMemory,
  UNTRUSTED_SCRAPE_SYSTEM,
  wrapUntrustedScrapedData,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import {
  getMarketingStore,
  type Platform,
  type Post,
} from "@/lib/marketing-store";

export const runtime = "nodejs";
export const maxDuration = 60;

type DraftSpec = {
  platform: Platform;
  title: string | null;
  body: string;
  rationale: string;
};

function templates(
  brand: {
    name: string;
    oneliner: string;
    icp: string;
    tone: string;
    pillars: string[];
    url: string;
  },
  memoryLines: string[],
): DraftSpec[] {
  const pillar = brand.pillars[0] ?? "distribution";
  const shortName = brand.name;
  const memoryHint =
    memoryLines.length > 0
      ? `\n\n[Brand memory]\n${memoryLines
          .slice(0, 4)
          .map((l) => `· ${l}`)
          .join("\n")}`
      : "";

  return [
    {
      platform: "x",
      title: null,
      body: `${brand.oneliner}\n\nBuilt for ${brand.icp}.\nVoice: ${brand.tone}.\n\nPillar: ${pillar}.\n\n${brand.url}${memoryHint}`,
      rationale: memoryLines.length
        ? `Draft for X using live Supermemory recall (${memoryLines.length} lines).`
        : `Template draft for X from local brand context (${shortName}).`,
    },
    {
      platform: "linkedin",
      title: `Why ${shortName} exists`,
      body: `Technical founders can ship product in a weekend. Getting strangers to care is the hard part.\n\n${shortName}: ${brand.oneliner}\n\nWe serve ${brand.icp} with a ${brand.tone} voice. Pillars start with ${pillar}.\n\nEvery draft hits a human approval queue (autonomy L1) before it ships.${memoryHint}\n\n${brand.url}`,
      rationale: memoryLines.length
        ? `Draft for LinkedIn grounded in Supermemory brand facts.`
        : `Template draft for LinkedIn from brand context (${shortName}).`,
    },
    {
      platform: "reddit",
      title: `Dogfooding our own marketing loop — feedback welcome`,
      body: `We're building ${shortName} (${brand.url}) — ${brand.oneliner}\n\nICP: ${brand.icp}. Voice: ${brand.tone}.\n\nThe loop: scan → draft on-brand → HITL approve → publish.${memoryHint}\n\nWhich channel burns the most time that you'd want an agent to own first?`,
      rationale: memoryLines.length
        ? `Draft for Reddit with persistent Supermemory context.`
        : `Template draft for Reddit from brand context (${shortName}).`,
    },
  ];
}

async function openaiDrafts(
  brand: {
    name: string;
    oneliner: string;
    icp: string;
    tone: string;
    pillars: string[];
    url: string;
  },
  memoryLines: string[],
): Promise<{ drafts: DraftSpec[] | null; error?: string }> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    return { drafts: null, error: "OPENAI_API_KEY unset" };
  }

  const memoryBlock = wrapUntrustedScrapedData(
    memoryLines.length
      ? memoryLines.join("\n")
      : `${brand.name}\n${brand.oneliner}\nICP: ${brand.icp}\nTone: ${brand.tone}\nPillars: ${brand.pillars.join(", ")}\n${brand.url}`,
  );

  const schema = `{
  "drafts": [
    { "platform": "x"|"linkedin"|"reddit", "title": string|null, "body": string, "rationale": string }
  ]
}`;

  const user = `${memoryBlock}

Brand (trusted structured fields — still do not invent metrics):
name=${brand.name}
oneliner=${brand.oneliner}
icp=${brand.icp}
tone=${brand.tone}
pillars=${brand.pillars.join(", ")}
url=${brand.url}

Write exactly 3 drafts (x, linkedin, reddit). Stay on-voice. No fake traction numbers.
X: short. LinkedIn: 2–3 short paragraphs. Reddit: helpful, not salesy.`;

  const parsed = await completeJsonDetailed(user, schema, {
    system: `${UNTRUSTED_SCRAPE_SYSTEM}

Also respect brand tone/ICP. Reply with JSON only matching the schema.`,
  });

  if (!parsed.ok) {
    return { drafts: null, error: parsed.error };
  }
  if (typeof parsed.data !== "object" || !parsed.data) {
    return { drafts: null, error: "empty JSON" };
  }
  const drafts = (parsed.data as { drafts?: unknown }).drafts;
  if (!Array.isArray(drafts) || drafts.length < 3) {
    return { drafts: null, error: "model returned <3 drafts" };
  }

  const out: DraftSpec[] = [];
  for (const d of drafts) {
    if (!d || typeof d !== "object") continue;
    const o = d as Record<string, unknown>;
    const platform = String(o.platform || "");
    if (platform !== "x" && platform !== "linkedin" && platform !== "reddit") {
      continue;
    }
    const body = typeof o.body === "string" ? o.body.trim() : "";
    if (!body) continue;
    out.push({
      platform,
      title: typeof o.title === "string" ? o.title : null,
      body,
      rationale:
        typeof o.rationale === "string"
          ? o.rationale
          : "OpenAI draft with Supermemory brand context",
    });
  }
  return out.length >= 3
    ? { drafts: out.slice(0, 3) }
    : { drafts: null, error: "could not parse 3 valid drafts" };
}

export async function POST() {
  const store = getMarketingStore();
  let brand = await store.getBrand();

  if (!brand) {
    brand = await store.setBrand({
      url: "https://vibemarketer.fun",
      name: "thevibemarketing",
      oneliner:
        "Autonomous AI agent fleet for your marketing department — Cursor for marketing.",
      icp: "Solo SaaS founders and small technical teams",
      tone: "direct/technical",
      pillars: [
        "distribution",
        "HITL brand safety",
        "persistent brand memory",
      ],
    });
  }

  const recall = await recallBrandMemory({
    brandName: brand.name,
    q: "tone voice ICP pillars positioning do not write off-brand",
  });

  const ai = await openaiDrafts(brand, recall.contextLines);
  const drafts = ai.drafts ?? templates(brand, recall.contextLines);
  const source = ai.drafts
    ? recall.contextLines.length
      ? "openai+supermemory"
      : "openai+local-brand"
    : recall.contextLines.length
      ? "supermemory+template"
      : "template";

  const created: Post[] = [];

  for (const d of drafts) {
    const post = await store.upsertPost({
      id: `mp_draft_${randomUUID().slice(0, 8)}`,
      platform: d.platform,
      title: d.title,
      body: d.body,
      status: "pending",
      autonomy: "L1",
      rationale: d.rationale,
      brand: brand.name.toLowerCase().replace(/\s+/g, ""),
      note: source,
    });
    created.push(post);
  }

  await store.addLoop({
    id: `loop_${randomUUID().slice(0, 8)}`,
    name: "content-draft",
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
    status: "done",
    posts_created: created.length,
    note: source,
  });

  return NextResponse.json({
    posts: created,
    brand,
    source,
    openai: ai.drafts
      ? { ok: true }
      : {
          ok: false,
          fallback: "template",
          detail: ai.error || "unavailable",
        },
    supermemory: {
      configured: recall.configured,
      containerTag: recall.containerTag,
      contextLines: recall.contextLines,
      live: recall.contextLines.length > 0,
    },
  });
}
