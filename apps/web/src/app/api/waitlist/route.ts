import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";
import { dataPath } from "@/lib/paths";

export const runtime = "nodejs";

type WaitlistSource = "waitlist" | "newsletter" | "pricing" | "blog" | "other";

type Entry = {
  email: string;
  name?: string;
  source: WaitlistSource;
  intent?: string;
  ts: string;
};

function parseSource(raw: unknown): WaitlistSource {
  const s = String(raw || "waitlist").toLowerCase();
  if (
    s === "newsletter" ||
    s === "pricing" ||
    s === "blog" ||
    s === "waitlist"
  ) {
    return s;
  }
  return "other";
}

export async function POST(req: Request) {
  const wantsJson =
    req.headers.get("accept")?.includes("application/json") ||
    (req.headers.get("content-type") || "").includes("application/json");

  let email = "";
  let name = "";
  let source: WaitlistSource = "waitlist";
  let intent = "";

  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = (await req.json()) as {
        email?: string;
        name?: string;
        source?: string;
        intent?: string;
      };
      email = body.email?.trim() || "";
      name = body.name?.trim() || "";
      source = parseSource(body.source);
      intent = body.intent?.trim() || "";
    } else {
      const form = await req.formData();
      email = String(form.get("email") || "").trim();
      name = String(form.get("name") || "").trim();
      source = parseSource(form.get("source"));
      intent = String(form.get("intent") || "").trim();
    }
  } catch {
    if (wantsJson) {
      return NextResponse.json({ error: "invalid body" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/?waitlist=invalid", req.url));
  }

  const normalized = email.toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    if (wantsJson) {
      return NextResponse.json({ error: "valid email required" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/?waitlist=invalid", req.url));
  }

  const file = dataPath("waitlist.jsonl");
  await fs.mkdir(dataPath(), { recursive: true });

  try {
    const existing = await fs.readFile(file, "utf8");
    if (
      existing
        .split("\n")
        .some((line) => line.includes(`"email":"${normalized}"`))
    ) {
      if (wantsJson) {
        return NextResponse.json({ ok: true, deduped: true, source });
      }
      return NextResponse.redirect(
        new URL(
          source === "newsletter" ? "/newsletter?ok=1" : "/?waitlist=ok",
          req.url,
        ),
      );
    }
  } catch {
    /* new file */
  }

  const entry: Entry = {
    email: normalized,
    source,
    ts: new Date().toISOString(),
  };
  if (name) entry.name = name.slice(0, 80);
  if (intent) entry.intent = intent.slice(0, 120);

  await fs.appendFile(file, JSON.stringify(entry) + "\n", "utf8");

  if (wantsJson) {
    return NextResponse.json({ ok: true, source });
  }
  return NextResponse.redirect(
    new URL(
      source === "newsletter" ? "/newsletter?ok=1" : "/?waitlist=ok",
      req.url,
    ),
  );
}
