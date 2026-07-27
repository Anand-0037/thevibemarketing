import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { executePublishOutboxBatch } from "@/lib/publishing/publish-attempt-service";

export const runtime = "nodejs";
export const maxDuration = 60;

type DrainBody = {
  batchSize?: number;
  leaseMs?: number;
  leaseOwner?: string;
};

function getWorkerSecret(): string {
  return process.env.INTERNAL_WORKER_SECRET?.trim() || "";
}

function getProvidedSecret(req: Request): string {
  const header = req.headers.get("x-internal-secret");
  if (header) return header.trim();

  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();

  const { searchParams } = new URL(req.url);
  const querySecret = searchParams.get("secret");
  if (querySecret) return querySecret.trim();

  const vercelSecret = req.headers.get("x-vercel-cron-signature");
  if (vercelSecret && getWorkerSecret()) return vercelSecret.trim();

  return "";
}

function normalizeHeaderValue(value: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function secretsMatch(a: string, b: string): boolean {
  const normalizedA = a;
  const normalizedB = b;

  if (normalizedA.length !== normalizedB.length) {
    return false;
  }

  const hashA = createHash("sha256").update(normalizedA).digest();
  const hashB = createHash("sha256").update(normalizedB).digest();
  return timingSafeEqual(hashA, hashB);
}

function unauthorized(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const configured = getWorkerSecret();
  if (!configured) {
    return unauthorized("INTERNAL_WORKER_SECRET is not configured", 401);
  }

  const provided = getProvidedSecret(req);
  if (!provided || !secretsMatch(provided, configured)) {
    return unauthorized("Invalid internal worker secret", 401);
  }

  let body: DrainBody = {};
  try {
    body = (await req.json()) as DrainBody;
  } catch {
    body = {};
  }

  const batchSizeRaw = Number(body.batchSize);
  const leaseMsRaw = Number(body.leaseMs);
  const leaseOwner =
    normalizeHeaderValue(req.headers.get("x-internal-worker")) ||
    normalizeHeaderValue(req.headers.get("x-vercel-cron-id")) ||
    body.leaseOwner?.trim() ||
    `internal-${Date.now()}`;

  const result = await executePublishOutboxBatch({
    leaseOwner,
    batchSize: Number.isFinite(batchSizeRaw) ? batchSizeRaw : 5,
    leaseMs: Number.isFinite(leaseMsRaw) ? leaseMsRaw : 30_000,
  });

  const response = {
    processed: result.processed,
    claimed: result.claimed,
    skipped: result.skipped,
    errors: result.errors,
  };

  return NextResponse.json(response);
}
