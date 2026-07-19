import { NextResponse } from "next/server";
import { isPostgresDualEnabled } from "@/lib/postgres-dual";
import { getSupabaseAdmin, hasSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/** GET /api/ready — migration + dual-write readiness (no secrets). */
export async function GET() {
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";
  checks.push({
    name: "NEXT_PUBLIC_SITE_URL",
    ok: /vibemarketer\.fun/.test(site) || process.env.VERCEL !== "1",
    detail: site || "unset",
  });

  checks.push({
    name: "SUPABASE_URL",
    ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()),
    detail: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
      ? "set"
      : "missing",
  });

  checks.push({
    name: "SUPABASE_SERVICE_ROLE",
    ok: hasSupabaseAdmin(),
    detail: hasSupabaseAdmin() ? "set" : "missing — waitlist/marketing/decks need it",
  });

  const dual = isPostgresDualEnabled();
  checks.push({
    name: "POSTGRES_DUAL",
    ok: dual || process.env.VERCEL !== "1",
    detail: dual
      ? "ON"
      : "OFF — Radar will not persist across serverless instances",
  });

  if (hasSupabaseAdmin()) {
    const sb = getSupabaseAdmin()!;
    const tables = [
      "workspaces",
      "founders",
      "subscribers",
      "marketing_state",
    ] as const;
    for (const table of tables) {
      const { error } = await sb.from(table).select("*").limit(1);
      checks.push({
        name: `table:${table}`,
        ok: !error,
        detail: error ? error.message : "ok",
      });
    }

    const { data: buckets, error: bErr } = await sb.storage.listBuckets();
    const hasDecks = Boolean(buckets?.some((b) => b.id === "decks" || b.name === "decks"));
    checks.push({
      name: "storage:decks",
      ok: !bErr && hasDecks,
      detail: bErr
        ? bErr.message
        : hasDecks
          ? "bucket ready"
          : "missing — run migration 20260719030000",
    });
  }

  const ok = checks.every((c) => c.ok);
  return NextResponse.json(
    {
      ok,
      dual,
      checkedAt: new Date().toISOString(),
      checks,
      tip: "Apply supabase/migrations/*.sql then set SUPABASE_SERVICE_ROLE_KEY + USE_POSTGRES_DUAL=1 on Vercel.",
    },
    { status: ok ? 200 : 503 },
  );
}
