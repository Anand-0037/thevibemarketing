import {
  coherenceFromSignals,
  composeFounderScoreFromGravity,
  ingestAsFounderDrafts,
  scoreGravityFromSignals,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { withOwnedStore } from "@/lib/with-store";

export const runtime = "nodejs";

/**
 * POST /api/ingest — live GitHub + HN + arXiv only.
 * Product Hunt / accelerators / hackathons → not configured (zero rows).
 * Discovered authors are candidates — not auto-verified founders.
 */
export async function POST(req: Request) {
  return withOwnedStore(async () => {
    const url = new URL(req.url);
    const dry = url.searchParams.get("dry") === "1";
    const limit = Math.min(
      40,
      Math.max(1, Number(url.searchParams.get("limit") || 20) || 20),
    );

    try {
      const { items, drafts, sources } = await ingestAsFounderDrafts();
      const selected = drafts.slice(0, limit);
      const liveOk =
        sources.github.ok || sources.hackernews.ok || sources.arxiv.ok;

      if (dry) {
        return NextResponse.json({
          ok: true,
          dry: true,
          sources,
          live_ok: liveOk,
          item_count: items.length,
          draft_count: drafts.length,
          selected: selected.map((d) => ({
            id: d.founder.id,
            name: d.founder.name,
            signals: d.signals.length,
            product: d.product.name,
            identity: "candidate",
          })),
        });
      }

      if (!liveOk && selected.length === 0) {
        return NextResponse.json({
          ok: false,
          sources,
          live_ok: false,
          item_count: 0,
          upserted_count: 0,
          upserted: [],
          note: "No live sources returned data. No fabricated fallbacks.",
        });
      }

      const store = getStore();
      const upserted: Array<{
        id: string;
        name: string;
        founder_score: number;
        gravity: number;
        identity: "candidate";
      }> = [];

      for (const draft of selected) {
        const founder = await store.upsertFounder({
          ...draft.founder,
          founder_score: draft.founder.founder_score ?? 0,
          score_confidence: draft.founder.score_confidence ?? 0,
        });
        await store.upsertProduct({
          ...draft.product,
          founder_id: founder.id,
          id:
            draft.product.founder_id === founder.id
              ? draft.product.id
              : `p_${founder.id}`,
        });
        for (const s of draft.signals) {
          await store.addSignal({
            entity_type: s.entity_type,
            entity_id: founder.id,
            source: s.source,
            url: s.url,
            payload: {
              ...s.payload,
              identity_state: "candidate",
              discovered_via: "identify",
            },
            observed_at: s.observed_at,
          });
        }
        const signals = await store.getSignalsFor(founder.id);
        const gravity = scoreGravityFromSignals(signals);
        const score = composeFounderScoreFromGravity(gravity, {
          coherence: coherenceFromSignals(
            new Set(signals.map((x) => x.source)).size,
          ),
          track_record: null,
        });
        const updated = await store.upsertFounder({
          id: founder.id,
          name: founder.name,
          founder_score: score.founder_score,
          score_confidence: score.score_confidence,
          gravity,
        });
        upserted.push({
          id: updated.id,
          name: updated.name,
          founder_score: updated.founder_score,
          gravity: gravity.gravity_score,
          identity: "candidate",
        });
      }

      const dedupe = await store.dedupeFounders();
      upserted.sort((a, b) => b.founder_score - a.founder_score);

      return NextResponse.json({
        ok: upserted.length > 0,
        sources,
        live_ok: liveOk,
        item_count: items.length,
        upserted_count: upserted.length,
        dedupe,
        note: "Identify upserts discovered candidates from live sources only.",
        upserted,
      });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Ingest failed" },
        { status: 500 },
      );
    }
  });
}

export async function GET() {
  return NextResponse.json({
    tip: "POST /api/ingest — live GitHub+HN+arXiv only. Unavailable sources return 0 rows.",
  });
}
