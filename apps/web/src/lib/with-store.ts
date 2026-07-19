import { NextResponse } from "next/server";
import { requireUser, type AuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isAuthBypassed, isAuthConfigured } from "@/lib/supabase/config";
import { runWithWorkspaceOwner } from "@/lib/workspace-context";

/** Private API: auth required + owner-scoped Memory/Postgres. */
export async function withOwnedStore<T>(
  handler: (user: AuthUser) => Promise<T>,
): Promise<T | NextResponse> {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  return runWithWorkspaceOwner(auth.user.id, () => handler(auth.user));
}

/** Public/optional-auth (e.g. inbound apply). */
export async function withOptionalStore<T>(
  handler: (user: AuthUser | null) => Promise<T>,
): Promise<T> {
  let user: AuthUser | null = null;
  if (isAuthBypassed()) {
    user = { id: "local-bypass", email: "local@bypass.dev" };
  } else if (isAuthConfigured()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user?.id) {
        user = { id: data.user.id, email: data.user.email };
      }
    } catch {
      /* anonymous */
    }
  }
  const owner = user?.id ?? "inbound";
  return runWithWorkspaceOwner(owner, () => handler(user));
}
