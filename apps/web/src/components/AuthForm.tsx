"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  signInWithGoogle,
  signInWithPassword,
  signUpWithPassword,
  type AuthActionState,
} from "@/app/login/actions";

const initial: AuthActionState = {};

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  next = "/app",
  authReady,
}: {
  mode: Mode;
  next?: string;
  authReady: boolean;
}) {
  const action = mode === "login" ? signInWithPassword : signUpWithPassword;
  const [state, formAction, pending] = useActionState(action, initial);
  const [googleState, googleAction, googlePending] = useActionState(
    signInWithGoogle,
    initial,
  );

  const error = state.error || googleState.error;
  const message = state.message;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
      <p className="section-label mb-2">Account</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">
        {mode === "login" ? "Sign in" : "Create account"}
      </h1>
      <p className="mt-3 text-sm text-muted">
        {mode === "login"
          ? "Google or email + password. Sessions stay in HttpOnly cookies."
          : "Sign up with Google or email + password (8+ chars, letter + number)."}
      </p>

      {!authReady ? (
        <div className="panel mt-8 border-warn/40 p-4 text-sm text-muted" role="status">
          Auth is not wired yet. Add{" "}
          <span className="font-mono text-xs text-ink">
            NEXT_PUBLIC_SUPABASE_URL
          </span>{" "}
          and{" "}
          <span className="font-mono text-xs text-ink">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </span>{" "}
          to <span className="font-mono text-xs">.env</span> — see{" "}
          <Link href="/get-started" className="text-accent hover:underline">
            get started
          </Link>{" "}
          / AUTH.md. Until then the app stays open locally.
        </div>
      ) : null}

      <form action={googleAction} className="mt-8">
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="btn-ghost focus-ring flex w-full items-center justify-center gap-2 text-base"
          disabled={!authReady || googlePending || pending}
        >
          <GoogleMark />
          {googlePending ? "Redirecting…" : "Continue with Google"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        or email
        <span className="h-px flex-1 bg-line" />
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        <div>
          <label htmlFor="email" className="section-label mb-2 block">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className="input-field w-full"
            placeholder="you@company.com"
            disabled={!authReady || pending}
          />
        </div>
        <div>
          <label htmlFor="password" className="section-label mb-2 block">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={8}
            maxLength={72}
            className="input-field w-full"
            disabled={!authReady || pending}
          />
        </div>
        {mode === "signup" ? (
          <div>
            <label htmlFor="confirm" className="section-label mb-2 block">
              Confirm password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              className="input-field w-full"
              disabled={!authReady || pending}
            />
          </div>
        ) : null}

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-accent" role="status">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="btn-primary focus-ring w-full text-base"
          disabled={!authReady || pending || googlePending}
        >
          {pending
            ? mode === "login"
              ? "Signing in…"
              : "Creating…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-sm text-muted">
        {mode === "login" ? (
          <>
            No account?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(next)}`}
              className="text-accent hover:underline"
            >
              Sign up
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={`/login?next=${encodeURIComponent(next)}`}
              className="text-accent hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.3 0-9.7-2.9-11.3-7.1l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.3 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 37.3 44 32 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}
