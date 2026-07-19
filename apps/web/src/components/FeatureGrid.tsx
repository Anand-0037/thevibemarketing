import Link from "next/link";
import { FEATURES, type Feature } from "@/content/features";

const STATUS_LABEL: Record<Feature["status"], string> = {
  live: "product",
  app: "in app",
  addon: "add-on",
};

export function FeatureGrid({
  ids,
  compact = false,
}: {
  ids?: string[];
  compact?: boolean;
}) {
  const list = ids
    ? FEATURES.filter((f) => ids.includes(f.id))
    : FEATURES;

  return (
    <ul
      className={
        compact
          ? "divide-y divide-line border-y border-line"
          : "grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3"
      }
      aria-label="Product features"
    >
      {list.map((f) => (
        <li
          key={f.id}
          id={f.id}
          className={
            compact
              ? "scroll-mt-24 py-8 first:pt-0"
              : "scroll-mt-24 bg-bg-panel p-6 transition-colors hover:bg-bg-elevated"
          }
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-xl font-semibold tracking-tight">
              {f.name}
            </h3>
            <span className="font-mono text-[11px] uppercase tracking-widest text-accent">
              {STATUS_LABEL[f.status]}
            </span>
          </div>
          <p className="mt-2 text-base font-medium text-ink/90">{f.tagline}</p>
          <p className="mt-2 text-base leading-relaxed text-muted">{f.body}</p>
          {f.href ? (
            <Link
              href={f.href}
              className="mt-4 inline-block text-sm text-accent hover:underline focus-ring"
            >
              {f.hrefLabel ?? "Open"} →
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
