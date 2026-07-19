import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAuthBypassed, isAuthConfigured } from "@/lib/supabase/config";
import { runWithWorkspaceOwner } from "@/lib/workspace-context";

export type AuthUser = {
  id: string;
  email?: string;
};

/**
 * Require an authenticated Supabase user for private API routes.
 * Returns 401 JSON when unauthenticated (unless AUTH_BYPASS for local only).
 */
export async function requireUser(): Promise<
  { user: AuthUser } | { error: NextResponse }
> {
  if (isAuthBypassed()) {
    return {
      user: {
        id: "local-bypass",
        email: "local@bypass.dev",
      },
    };
  }

  if (!isAuthConfigured()) {
    return {
      error: NextResponse.json(
        { error: "Auth is not configured" },
        { status: 503 },
      ),
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.id) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    };
  } catch {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

/** Auth + per-owner workspace context for Memory / dual-write. */
export async function withWorkspace<T>(
  handler: (user: AuthUser) => Promise<T>,
): Promise<T | NextResponse> {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  return runWithWorkspaceOwner(auth.user.id, () => handler(auth.user));
}
