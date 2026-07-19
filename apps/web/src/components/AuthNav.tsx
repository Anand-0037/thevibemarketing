"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAuthConfigured } from "@/lib/supabase/config";

type UserBrief = { email: string | null };

export function AuthNav() {
  const [user, setUser] = useState<UserBrief | null | undefined>(undefined);
  const configured = isAuthConfigured();

  useEffect(() => {
    if (!configured) {
      setUser(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (cancelled) return;
        setUser(data.user ? { email: data.user.email ?? null } : null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [configured]);

  if (user === undefined) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
        …
      </span>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden max-w-[10rem] truncate text-xs text-muted sm:inline"
          title={user.email ?? undefined}
        >
          {user.email}
        </span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
        Sign in
      </Link>
      <Link href="/signup" className="btn-primary focus-ring !px-3 !py-1.5 text-sm">
        Sign up
      </Link>
    </div>
  );
}
