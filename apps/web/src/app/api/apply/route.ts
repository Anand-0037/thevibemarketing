import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
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
import { dataPath } from "@/lib/paths";
import { getStore } from "@/lib/store";
import { withOptionalStore } from "@/lib/with-store";

export const runtime = "nodejs";
/** Keep apply short — no long Firecrawl loops in this serverless entry. */
export const maxDuration = 30;

async function parseBody(req: Request): Promise<{
  company_name?: string;
  deck_url?: string;
  oneliner?: string;
  founder_name?: string;
  sector?: string;
  deck_file_path?: string;
  deck_file_name?: string;
  deck_bytes?: number;
}> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const company_name = String(form.get("company_name") || "").trim();
    const deck_url = String(form.get("deck_url") || "").trim() || undefined;
    const oneliner = String(form.get("oneliner") || "").trim() || undefined;
    const founder_name = String(form.get("founder_name") || "").trim() || undefined;
    const sector = String(form.get("sector") || "").trim() || undefined;

    let deck_file_path: string | undefined;
    let deck_file_name: string | undefined;
    let deck_bytes: number | undefined;
    const file = form.get("deck_file");
    if (file && typeof file === "object" && "arrayBuffer" in file) {
      const f = file as File;
      if (f.size > 0) {
        if (f.size > MAX_DECK_UPLOAD_BYTES) {
          throw new Error(
            `Deck file must be under ${MAX_DECK_UPLOAD_BYTES / (1024 * 1024)}MB`,
          );
        }
        if (f.type && f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
          throw new Error("Deck upload must be a PDF");
        }
        const name = f.name || "deck.pdf";
        const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
        const dir = dataPath("uploads");
        await mkdir(dir, { recursive: true });
        const dest = `${dir}/${Date.now()}_${randomUUID().slice(0, 6)}_${safe}`;
        const buf = Buffer.from(await f.arrayBuffer());
        assertPdfMagic(buf);
        await writeFile(dest, buf);
        deck_file_path = dest;
        deck_file_name = name;
        deck_bytes = buf.length;
      }
    }

    return {
      company_name,
      deck_url,
      oneliner,
      founder_name,
      sector,
      deck_file_path,
      deck_file_name,
      deck_bytes,
    };
  }

  return (await req.json()) as {
    company_name?: string;
    deck_url?: string;
    oneliner?: string;
    founder_name?: string;
    sector?: string;
  };
}

export async function POST(req: Request) {
  let body: Awaited<ReturnType<typeof parseBody>>;
  try {
    body = await parseBody(req);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid body" },
      { status: 400 },
    );
  }

  if (!body.company_name?.trim()) {
    return NextResponse.json({ error: "company_name required" }, { status: 400 });
  }

  const deckUrl = body.deck_url?.trim();
  const hasDeck = Boolean(deckUrl || body.deck_file_path);
  if (!hasDeck) {
    return NextResponse.json(
      { error: "deck_url or deck_file required" },
      { status: 400 },
    );
  }

  if (deckUrl) {
    const pre = await preflightRemoteDeck(deckUrl);
    if (!pre.ok) {
      return NextResponse.json(
        { error: pre.error || "Deck URL failed preflight" },
        { status: 413 },
      );
    }
  }

  return withOptionalStore(async () => {
  const store = getStore();
  const companyName = (body.company_name ?? "").trim();
  const id = `inbound_${Date.now()}`;
  const now = new Date().toISOString();
  const name = body.founder_name?.trim() || "Inbound Founder";
  const deckRef =
    deckUrl ||
    (body.deck_file_name
      ? `upload://${body.deck_file_name}`
      : "upload://deck");

  const claims = [
    {
      text: `Deck: ${deckRef}`,
      category: "inbound" as const,
      confidence: 0.4,
      contradiction: false,
      ...(body.deck_file_path
        ? { evidence_url: `file://${body.deck_file_path}` }
        : deckUrl
          ? { evidence_url: deckUrl }
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
      deck_upload: Boolean(body.deck_file_path),
      deck_file: body.deck_file_name,
      deck_bytes: body.deck_bytes,
    },
    observed_at: now,
  });

  const signals = await store.getSignalsFor(id);
  const gravity = scoreGravityFromSignals(signals);
  const score = composeFounderScoreFromGravity(gravity, {
    coherence: coherenceFromSignals(new Set(signals.map((s) => s.source)).size),
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
  // File upload counts as deck present for first-pass
  const first_pass = firstPassScreen({
    founder: {
      ...founder,
      links: founder.links?.length
        ? founder.links
        : body.deck_file_path
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
    deck_uploaded: Boolean(body.deck_file_path),
    identity: "applicant",
    note: first_pass.pass
      ? "First-pass cleared — run 3-axis screen next (same funnel as outbound Converge)."
      : "Application stored — first-pass flagged issues (see checks).",
  });
  });
}
