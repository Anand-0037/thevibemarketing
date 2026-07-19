"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthNav } from "@/components/AuthNav";
import { CommandPalette } from "@/components/CommandPalette";
import { SITE_NAME } from "@/lib/site";

const items = [
  { href: "/app", label: "Home" },
  { href: "/app/radar", label: "Radar" },
  { href: "/app/compare", label: "Gravity compare" },
  { href: "/app/query", label: "NL query" },
  { href: "/app/thesis", label: "Thesis" },
  { href: "/app/apply", label: "Inbound" },
  { href: "/app/studio", label: "Studio" },
  { href: "/app/queue", label: "HITL queue" },
  { href: "/app/report", label: "Weekly report" },
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/memory", label: "Brand memory" },
  { href: "/app/connectors", label: "Connect OAuth" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-0px)] max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row">
      <aside className="w-full shrink-0 border-b border-line pb-4 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:w-52 md:self-start md:overflow-y-auto md:border-b-0 md:border-r md:pb-0 md:pr-6">
        <Link
          href="/"
          className="font-display text-sm font-bold text-ink hover:text-accent"
        >
          {SITE_NAME}
        </Link>
        <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-accent">
          App · VC Brain
        </p>
        <p className="mt-2 font-mono text-[10px] text-muted">⌘K shortcuts</p>
        <div className="mt-3">
          <AuthNav />
        </div>
        <nav
          className="mt-4 flex max-h-[50vh] flex-col gap-1 overflow-y-auto md:max-h-none"
          aria-label="App"
        >
          {items.map((i) => {
            const active =
              i.href === "/app"
                ? pathname === "/app"
                : pathname === i.href || pathname?.startsWith(`${i.href}/`);
            return (
              <Link
                key={i.href}
                href={i.href}
                prefetch
                className={`focus-ring px-3 py-2 text-sm ${
                  active
                    ? "border border-accent/40 bg-accent/10 text-accent"
                    : "border border-transparent text-muted hover:border-line hover:text-ink"
                }`}
              >
                {i.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
      <CommandPalette />
    </div>
  );
}
