"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthNav } from "@/components/AuthNav";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SITE_NAME } from "@/lib/site";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/product", label: "Product" },
  { href: "/tools/gravity-audit", label: "Tools" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/vc-brain", label: "VC Brain" },
  { href: "/get-started", label: "Get started" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (pathname?.startsWith("/app")) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="site-shell flex h-14 items-center justify-between">
        <Link
          href="/"
          className="focus-ring inline-flex items-center gap-2 tracking-tight"
          aria-label={`${SITE_NAME} home`}
        >
          <BrandMark className="h-7 w-7 shrink-0" />
          <span className="font-display text-lg font-bold">{SITE_NAME}</span>
        </Link>

        <nav
          className="hidden items-center gap-5 lg:!flex"
          aria-label="Primary"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`focus-ring text-sm transition hover:text-accent ${
                pathname === l.href ||
                (l.href !== "/#features" && pathname?.startsWith(`${l.href}/`))
                  ? "text-accent"
                  : "text-muted"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <ThemeToggle compact />
          <Link href="/app" className="btn-ghost focus-ring !px-3 !py-1.5 text-sm">
            Open app
          </Link>
          <AuthNav />
        </nav>

        <div className="flex items-center gap-2 lg:!hidden">
          <ThemeToggle compact />
          <button
            type="button"
            className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            Menu
          </button>
        </div>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-line px-4 py-3 lg:hidden"
          aria-label="Mobile"
        >
          <ul className="flex flex-col gap-3">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="focus-ring block text-sm text-muted hover:text-accent"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/app"
                className="focus-ring block text-sm text-accent"
                onClick={() => setOpen(false)}
              >
                Open app
              </Link>
            </li>
            <li>
              <Link
                href="/signup"
                className="focus-ring block text-sm font-semibold text-ink"
                onClick={() => setOpen(false)}
              >
                Start free
              </Link>
            </li>
            <li>
              <Link
                href="/login"
                className="focus-ring block text-sm text-muted hover:text-accent"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
            </li>
            <li className="pt-2">
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
