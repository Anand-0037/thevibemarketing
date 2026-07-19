"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  checkRateLimit,
  clientKeyFromHeaders,
} from "@/lib/auth/rate-limit";
import {
  normalizeEmail,
  validateEmail,
  validatePassword,
} from "@/lib/auth/validation";
import { isAuthConfigured, safeNextPath } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
};

function notConfigured(): AuthActionState {
  return {
    error:
      "Auth is not configured yet. Add Supabase URL + publishable key to .env (see AUTH.md).",
  };
}

async function rateLimited(action: string): Promise<AuthActionState | null> {
  const h = await headers();
  const hit = checkRateLimit(clientKeyFromHeaders(h, action), 12, 60_000);
  if (!hit.ok) {
    return {
      error: `Too many attempts. Try again in ${hit.retryAfterSec}s.`,
    };
  }
  return null;
}

export async function signInWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return notConfigured();
  const limited = await rateLimited("login");
  if (limited) return limited;

  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/app"));

  const emailErr = validateEmail(emailRaw);
  const passErr = validatePassword(password);
  if (emailErr || passErr) {
    return { error: emailErr || passErr };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(emailRaw),
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUpWithPassword(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return notConfigured();
  const limited = await rateLimited("signup");
  if (limited) return limited;

  const emailRaw = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? "/app"));

  const emailErr = validateEmail(emailRaw);
  const passErr = validatePassword(password);
  if (emailErr || passErr) {
    return { error: emailErr || passErr };
  }
  if (password !== confirm) {
    return { error: "Passwords do not match." };
  }

  const { siteUrl } = await import("@/lib/site");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(emailRaw),
    password,
    options: {
      emailRedirectTo: `${siteUrl("/auth/callback")}?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    // Generic message — avoid account enumeration.
    return { error: "Could not create account. Try again or sign in." };
  }

  // If email confirmations are off, session exists immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect(next);
  }

  return {
    message:
      "Check your email to confirm your account, then sign in.",
  };
}

export async function signInWithGoogle(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  if (!isAuthConfigured()) return notConfigured();
  if (process.env.NEXT_PUBLIC_GOOGLE_OAUTH !== "1") {
    return {
      error:
        "Google sign-in is not enabled yet. Use email + password, or enable the Google provider in Supabase and set NEXT_PUBLIC_GOOGLE_OAUTH=1.",
    };
  }
  const limited = await rateLimited("oauth-google");
  if (limited) return limited;

  const next = safeNextPath(String(formData.get("next") ?? "/app"));
  // Prefer canonical SITE_URL — request Origin can be apex/www mismatch.
  const { siteUrl } = await import("@/lib/site");
  const redirectTo = `${siteUrl("/auth/callback")}?next=${encodeURIComponent(next)}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    return {
      error:
        "Google sign-in unavailable. Enable the Google provider in Supabase Auth (Authentication → Providers → Google).",
    };
  }

  redirect(data.url);
}
