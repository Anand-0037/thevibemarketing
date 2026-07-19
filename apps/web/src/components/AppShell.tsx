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
      className={`focus-ring px-3 py-2 text-sm ${
        active
          ? "border border-accent/40 bg-accent/10 text-accent"
          : "border border-transparent text-muted hover:border-line hover:text-ink"
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
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <AuthNav />
          <ThemeToggle compact />
        </div>
        <nav
          className="mt-4 flex max-h-[50vh] flex-col gap-1 overflow-y-auto md:max-h-none"
          aria-label="VC Brain"
        >
          <p className="px-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-muted">
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
      <div className="min-w-0 flex-1">{children}</div>
      <CommandPalette />
    </div>
  );
}
