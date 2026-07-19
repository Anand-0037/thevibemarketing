import { createHash, randomUUID } from "node:crypto";
import {
  coherenceFromSignals,
  composeFounderScoreFromGravity,
  firstPassScreen,
  scoreGravityFromSignals,
} from "@vibe/engine";
import { NextResponse } from "next/server";
import {
  MAX_DECK_UPLOAD_BYTES,
  assertPdfMagic,
  preflightRemoteDeck,
} from "@/lib/deck-guards";
import { getStore } from "@/lib/store";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase-admin";
import { normalizeHttpUrl } from "@/lib/url";
import { getWorkspaceOwnerId } from "@/lib/workspace-context";
import { withOptionalStore } from "@/lib/with-store";

export const runtime = "nodejs";
export const maxDuration = 30;

type ParsedApply = {
  company_name?: string;
  deck_url?: string;
  oneliner?: string;
  founder_name?: string;
  sector?: string;
  deck_file_name?: string;
  deck_bytes?: number;
  deck_sha256?: string;
  deck_storage_path?: string;
  deck_buf?: Buffer;
};

async function parseBody(req: Request): Promise<ParsedApply> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const company_name = String(form.get("company_name") || "").trim();
    const deck_url =
      normalizeHttpUrl(String(form.get("deck_url") || "")) || undefined;
    const oneliner = String(form.get("oneliner") || "").trim() || undefined;
    const founder_name =
      String(form.get("founder_name") || "").trim() || undefined;
    const sector = String(form.get("sector") || "").trim() || undefined;

    // When a deck URL is present, ignore local file (avoids Vercel 413 + FS writes).
    if (deck_url) {
      return {
        company_name,
        deck_url,
        oneliner,
        founder_name,
        sector,
      };
    }

    let deck_file_name: string | undefined;
    let deck_bytes: number | undefined;
    let deck_sha256: string | undefined;
    let deck_buf: Buffer | undefined;
    const file = form.get("deck_file");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const f = file as File;
      if (f.size > 0) {
        if (f.size > MAX_DECK_UPLOAD_BYTES) {
          throw new Error(
            `Deck file must be under ${MAX_DECK_UPLOAD_BYTES / (1024 * 1024)}MB`,
          );
        }
        if (
          f.type &&
          f.type !== "application/pdf" &&
          !f.name.toLowerCase().endsWith(".pdf")
        ) {
          throw new Error("Deck upload must be a PDF");
        }
        const name = f.name || "deck.pdf";
        const buf = Buffer.from(await f.arrayBuffer());
        assertPdfMagic(buf);
        deck_file_name = name;
        deck_bytes = buf.length;
        deck_sha256 = createHash("sha256").update(buf).digest("hex").slice(0, 16);
        deck_buf = buf;
      }
    }

    return {
      company_name,
      oneliner,
      founder_name,
      sector,
      deck_file_name,
      deck_bytes,
      deck_sha256,
      deck_buf,
    };
  }

  const json = (await req.json()) as {
    company_name?: string;
    deck_url?: string;
    oneliner?: string;
    founder_name?: string;
    sector?: string;
  };
  return {
    ...json,
    deck_url: normalizeHttpUrl(String(json.deck_url || "")) || undefined,
  };
}

async function uploadDeckToStorage(
  buf: Buffer,
  fileName: string,
  ownerId: string,
): Promise<string | undefined> {
  if (!hasSupabaseAdmin()) return undefined;
  const sb = getSupabaseAdmin()!;
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
  const path = `${ownerId}/${Date.now()}_${randomUUID().slice(0, 8)}_${safe}`;
  const { error } = await sb.storage.from("decks").upload(path, buf, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) {
    console.error("[apply] storage upload:", error.message);
    return undefined;
  }
  return path;
}

export async function POST(req: Request) {
  let body: ParsedApply;
  try {
    body = await parseBody(req);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid body" },
      { status: 400 },
    );
  }

  if (!body.company_name?.trim()) {
    return NextResponse.json(
      { ok: false, error: "company_name required" },
      { status: 400 },
    );
  }

  const deckUrl = body.deck_url?.trim();
  const hasDeck = Boolean(deckUrl || body.deck_file_name);
  if (!hasDeck) {
    return NextResponse.json(
      { ok: false, error: "deck_url or deck_file required" },
      { status: 400 },
    );
  }

  let deckUrlIsPdf = false;
  let deckUrlNote: string | undefined;
  let materialsKind: "pdf_deck" | "website" | "unknown" | undefined;
  if (deckUrl) {
    const pre = await preflightRemoteDeck(deckUrl);
    materialsKind = pre.kind;
    if (!pre.accepted) {
      return NextResponse.json(
        {
          ok: false,
          error:
            pre.error ||
            "Deck / materials URL is not allowed (use a public https product site or PDF host).",
        },
        { status: 400 },
      );
    }
    deckUrlIsPdf = pre.ok && pre.kind === "pdf_deck";
    // Soft notes only — never present website materials as a hard error.
    if (pre.note) deckUrlNote = pre.note;
    else if (pre.kind === "website") {
      deckUrlNote =
        "Product/website URL accepted as materials (not a PDF deck).";
    }
  }

  try {
    return await withOptionalStore(async () => {
      const store = getStore();
      const companyName = (body.company_name ?? "").trim();
      const id = `inbound_${Date.now()}`;
      const now = new Date().toISOString();
      const name = body.founder_name?.trim() || "Inbound Founder";
      const ownerId = getWorkspaceOwnerId() || "inbound";

      let deck_storage_path = body.deck_storage_path;
      if (!deckUrl && body.deck_buf && body.deck_file_name) {
        deck_storage_path = await uploadDeckToStorage(
          body.deck_buf,
          body.deck_file_name,
          ownerId,
        );
      }

      const deckRef =
        deckUrl ||
        (deck_storage_path
          ? `storage://decks/${deck_storage_path}`
          : body.deck_file_name
            ? `upload://${body.deck_file_name}`
            : "upload://deck");

      if (!deckUrl && body.deck_file_name && !deck_storage_path) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "PDF upload needs Supabase Storage (bucket `decks` + service role). Prefer a direct deck URL for the demo.",
          },
          { status: 503 },
        );
      }

      const claims = [
        {
          text: `Deck: ${deckRef}${body.deck_sha256 ? ` · sha256:${body.deck_sha256}` : ""}`,
          category: "inbound" as const,
          confidence: 0.4,
          contradiction: false,
          ...(deckUrl
            ? { evidence_url: deckUrl }
            : deck_storage_path
              ? { evidence_url: `storage://decks/${deck_storage_path}` }
              : {}),
        },
      ];

      await store.upsertFounder({
        id,
        name,
        handles: {},
        links: deckUrl ? [deckUrl] : [],
        bio: `Inbound application for ${companyName}`,
        claims,
        founder_score: 0,
        score_confidence: 0.3,
      });

      await store.upsertProduct({
        id: `p_${id}`,
        founder_id: id,
        name: companyName,
        domain: undefined,
        oneliner: body.oneliner || undefined,
        sector: body.sector || "developer tools",
        stage: "pre-seed",
        traction_claims: [],
      });

      await store.addSignal({
        entity_type: "founder",
        entity_id: id,
        source: "inbound",
        url: deckUrl || deckRef,
        payload: {
          engagement: 0,
          followers: 0,
          deck_upload: Boolean(body.deck_file_name),
          deck_file: body.deck_file_name,
          deck_bytes: body.deck_bytes,
          deck_sha256: body.deck_sha256,
          deck_storage_path,
        },
        observed_at: now,
      });

      const sb = getSupabaseAdmin();
      if (sb) {
        const { error } = await sb.from("inbound_applications").upsert({
          id,
          owner_id: ownerId === "inbound" ? null : ownerId,
          company_name: companyName,
          founder_name: name,
          oneliner: body.oneliner ?? null,
          sector: body.sector ?? null,
          deck_url: deckUrl ?? null,
          deck_storage_path: deck_storage_path ?? null,
          deck_file_name: body.deck_file_name ?? null,
          deck_bytes: body.deck_bytes ?? null,
          deck_sha256: body.deck_sha256 ?? null,
        });
        if (error) console.error("[apply] inbound_applications", error.message);
      }

      const signals = await store.getSignalsFor(id);
      const gravity = scoreGravityFromSignals(signals);
      const score = composeFounderScoreFromGravity(gravity, {
        coherence: coherenceFromSignals(
          new Set(signals.map((s) => s.source)).size,
        ),
        track_record: null,
      });
      const founder = await store.upsertFounder({
        id,
        name,
        founder_score: score.founder_score,
        score_confidence: score.score_confidence,
        gravity,
      });

      const product = await store.getProductForFounder(id);
      const thesis = await store.getThesis();
      const first_pass = firstPassScreen({
        founder: {
          ...founder,
          links: founder.links?.length
            ? founder.links
            : body.deck_file_name
              ? [deckRef]
              : [],
        },
        product,
        thesis,
        requireDeck: true,
      });

      return NextResponse.json({
        ok: first_pass.pass,
        founder_id: id,
        first_pass,
        deck_uploaded: Boolean(body.deck_file_name),
        deck_url_is_pdf: deckUrlIsPdf,
        materials_kind: materialsKind ?? null,
        deck_storage_path: deck_storage_path ?? null,
        identity: "applicant",
        note: [
          first_pass.pass
            ? "First-pass cleared — open founder → run 3-axis screen next."
            : "Application stored — first-pass flagged issues (see checks).",
          deckUrlNote,
        ]
          .filter(Boolean)
          .join(" "),
      });
    });
  } catch (e) {
    console.error("[apply]", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Apply failed",
      },
      { status: 500 },
    );
  }
}
