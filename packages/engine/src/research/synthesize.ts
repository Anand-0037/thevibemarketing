import { randomUUID } from "node:crypto";
import { completeJsonDetailed } from "../adapters/openai";
import {
  UNTRUSTED_SCRAPE_SYSTEM,
  wrapUntrustedScrapedData,
} from "../prompts/untrusted-scrape";
import type { Founder, Product } from "../types";
import type { ResearchFinding, ResearchHit } from "./types";

export type SynthesizeResult = {
  findings: ResearchFinding[];
  open_questions: string[];
  synthesis: "openai" | "heuristic" | "skipped";
};

function heuristicFromHits(
  hits: ResearchHit[],
  founder: Founder,
  product?: Product | null,
): SynthesizeResult {
  const findings: ResearchFinding[] = [];
  const withUrl = hits.filter((h) => /^https?:\/\//i.test(h.url));

  if (withUrl.length > 0) {
    const top = withUrl.slice(0, 4);
    findings.push({
      id: `rf_${randomUUID().slice(0, 8)}`,
      claim: `Public web footprint exists for ${founder.name}${product?.name ? ` / ${product.name}` : ""} across ${top.length} indexed sources.`,
      topic: "founder",
      support: "supported",
      citations: top.map((h) => ({
        url: h.url,
        snippet: h.excerpt.slice(0, 160),
        source: h.provider,
      })),
      confidence: Math.min(0.75, 0.35 + top.length * 0.08),
    });
  }

  const scrapeHits = hits.filter((h) => h.query === "scrape" && h.excerpt.length > 80);
  if (scrapeHits[0]) {
    findings.push({
      id: `rf_${randomUUID().slice(0, 8)}`,
      claim: `Primary site/page scrape returned ${scrapeHits[0].excerpt.length} chars of markdown for diligence.`,
      topic: "product",
      support: "supported",
      citations: [
        {
          url: scrapeHits[0].url,
          snippet: scrapeHits[0].excerpt.slice(0, 160),
          source: "firecrawl",
        },
      ],
      confidence: 0.55,
    });
  }

  const e2b = hits.find((h) => h.provider === "e2b");
  if (e2b) {
    findings.push({
      id: `rf_${randomUUID().slice(0, 8)}`,
      claim: `Sandbox code forensics ran on linked GitHub repo (${e2b.title}).`,
      topic: "product",
      support: "supported",
      citations: [
        {
          url: e2b.url,
          snippet: e2b.excerpt.slice(0, 160),
          source: "e2b",
        },
      ],
      confidence: 0.6,
    });
  }

  const open_questions = [
    "Cap table / ownership: not disclosed in public sources",
    "Verified revenue / MRR: not disclosed",
    "Customer references: unavailable from open web",
  ];
  if (!product?.sector) {
    open_questions.push("Sector classification: unclear from public materials");
  }
  if (withUrl.length < 2) {
    open_questions.push("Thin public web coverage — more outbound diligence needed");
  }

  return {
    findings,
    open_questions,
    synthesis: hits.length === 0 ? "skipped" : "heuristic",
  };
}

/**
 * Cite-only synthesis. OpenAI may rephrase evidence; it must not invent URLs or metrics.
 * Falls back to heuristic dossier when the model is unavailable.
 */
export async function synthesizeResearch(opts: {
  founder: Founder;
  product?: Product | null;
  hits: ResearchHit[];
}): Promise<SynthesizeResult> {
  const { founder, product, hits } = opts;
  const fallback = heuristicFromHits(hits, founder, product);

  if (!process.env.OPENAI_API_KEY?.trim() || hits.length === 0) {
    return fallback;
  }

  const packed = hits
    .slice(0, 18)
    .map(
      (h, i) =>
        `[${i}] provider=${h.provider} query=${h.query}\nurl=${h.url}\ntitle=${h.title}\nexcerpt=${h.excerpt.slice(0, 320)}`,
    )
    .join("\n\n");

  const schema = `{
  "findings": [
    {
      "claim": string,
      "topic": "founder"|"product"|"market"|"competition"|"traction"|"risk",
      "support": "supported"|"unsupported"|"unknown",
      "citation_indexes": number[],
      "confidence": number
    }
  ],
  "open_questions": string[]
}`;

  const user = `${wrapUntrustedScrapedData(packed)}

Founder (trusted labels only — do not invent bio/metrics):
name=${founder.name}
product=${product?.name ?? "n/a"}
oneliner=${product?.oneliner ?? "n/a"}
sector=${product?.sector ?? "n/a"}
domain=${product?.domain ?? "n/a"}

Task: Produce 3–7 diligence findings for a $100K check decision-support memo.
RULES:
- Every finding MUST cite citation_indexes into the packed sources above.
- Never invent URLs, funding amounts, user counts, or competitors not present in excerpts.
- If evidence is missing, put it in open_questions with support unknown — do not guess.
- Reply JSON only.`;

  try {
    const parsed = await completeJsonDetailed(user, schema, {
      system: `${UNTRUSTED_SCRAPE_SYSTEM}

You are a VC diligence synthesizer. Cite only. Prefer "unknown" over hallucination.`,
    });
    if (!parsed.ok || !parsed.data || typeof parsed.data !== "object") {
      return fallback;
    }
    const data = parsed.data as {
      findings?: unknown[];
      open_questions?: unknown[];
    };
    if (!Array.isArray(data.findings) || data.findings.length === 0) {
      return fallback;
    }

    const findings: ResearchFinding[] = [];
    for (const raw of data.findings.slice(0, 8)) {
      if (!raw || typeof raw !== "object") continue;
      const o = raw as Record<string, unknown>;
      const claim = typeof o.claim === "string" ? o.claim.trim() : "";
      if (!claim) continue;
      const indexes = Array.isArray(o.citation_indexes)
        ? o.citation_indexes.filter((n): n is number => typeof n === "number")
        : [];
      const citations = indexes
        .map((i) => hits[i])
        .filter(Boolean)
        .slice(0, 4)
        .map((h) => ({
          url: h!.url,
          snippet: h!.excerpt.slice(0, 160),
          source: h!.provider,
        }));
      if (citations.length === 0) continue;
      const topicRaw = String(o.topic ?? "risk");
      const topics = [
        "founder",
        "product",
        "market",
        "competition",
        "traction",
        "risk",
      ] as const;
      const topic = (
        topics as readonly string[]
      ).includes(topicRaw)
        ? (topicRaw as ResearchFinding["topic"])
        : "risk";
      const supportRaw = String(o.support ?? "unknown");
      findings.push({
        id: `rf_${randomUUID().slice(0, 8)}`,
        claim,
        topic,
        support:
          supportRaw === "supported" || supportRaw === "unsupported"
            ? supportRaw
            : "unknown",
        citations,
        confidence:
          typeof o.confidence === "number"
            ? Math.min(1, Math.max(0, o.confidence))
            : 0.5,
      });
    }

    if (findings.length === 0) return fallback;

    const open_questions = Array.isArray(data.open_questions)
      ? data.open_questions
          .filter((q): q is string => typeof q === "string")
          .map((q) => q.trim())
          .filter(Boolean)
          .slice(0, 8)
      : fallback.open_questions;

    return {
      findings,
      open_questions:
        open_questions.length > 0 ? open_questions : fallback.open_questions,
      synthesis: "openai",
    };
  } catch {
    return fallback;
  }
}
