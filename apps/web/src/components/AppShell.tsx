"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AuthNav } from "@/components/AuthNav";
import { CommandPalette } from "@/components/CommandPalette";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/site";

/** Challenge 02 path — judges land here first. */
const vcBrainItems = [
  { href: "/app", label: "Home" },
  { href: "/app/radar", label: "Radar" },
  { href: "/app/compare", label: "Gravity compare" },
  { href: "/app/query", label: "NL query" },
  { href: "/app/thesis", label: "Thesis" },
  { href: "/app/apply", label: "Inbound" },
];

/** Marketing fleet — secondary; not the VC Brain submission. */
const fleetItems = [
  { href: "/app/studio", label: "Studio" },
  { href: "/app/queue", label: "HITL queue" },
  { href: "/app/report", label: "Weekly report" },
  { href: "/app/onboarding", label: "Onboarding" },
  { href: "/app/memory", label: "Brand memory (fleet)" },
  { href: "/app/connectors", label: "Connect OAuth" },
];

function NavLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string | null;
}) {
  const active =
    href === "/app"
      ? pathname === "/app"
      : pathname === href || pathname?.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      prefetch
      className={`focus-ring block border-l-2 px-3 py-2 text-sm transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-transparent text-muted hover:border-line hover:bg-bg-elevated hover:text-ink"
      }`}
    >
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fleetActive = fleetItems.some(
    (i) => pathname === i.href || pathname?.startsWith(`${i.href}/`),
  );
  const [fleetOpen, setFleetOpen] = useState(fleetActive);

  return (
    <div className="site-shell flex min-h-[calc(100vh-0px)] flex-col gap-8 py-8 md:flex-row md:gap-10">
      <aside className="w-full shrink-0 border-b border-line pb-5 md:sticky md:top-8 md:max-h-[calc(100vh-4rem)] md:w-56 md:self-start md:overflow-y-auto md:border-b-0 md:border-r md:pb-0 md:pr-6">
        <Link
          href="/"
          className="font-display text-base font-bold tracking-tight text-ink hover:text-accent"
        >
          {SITE_NAME}
        </Link>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-widest text-accent">
          App · VC Brain
        </p>
        <p className="mt-1 font-mono text-[10px] text-muted">⌘K shortcuts</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AuthNav />
          <ThemeToggle compact />
        </div>
        <nav
          className="mt-5 flex max-h-[50vh] flex-col gap-0.5 overflow-y-auto md:max-h-none"
          aria-label="VC Brain"
        >
          <p className="px-3 pb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
            Challenge 02
          </p>
          {vcBrainItems.map((i) => (
            <NavLink
              key={i.href}
              href={i.href}
              label={i.label}
              pathname={pathname}
            />
          ))}
          <button
            type="button"
            className="mt-4 flex w-full items-center justify-between px-3 pb-1 text-left font-mono text-[10px] uppercase tracking-widest text-muted hover:text-ink"
            aria-expanded={fleetOpen}
            onClick={() => setFleetOpen((o) => !o)}
          >
            <span>Marketing fleet</span>
            <span aria-hidden>{fleetOpen ? "▾" : "▸"}</span>
          </button>
          {fleetOpen
            ? fleetItems.map((i) => (
                <NavLink
                  key={i.href}
                  href={i.href}
                  label={i.label}
                  pathname={pathname}
                />
              ))
            : null}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 rise">{children}</div>
      <CommandPalette />
    </div>
  );
}
