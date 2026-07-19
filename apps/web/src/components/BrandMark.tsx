import { SITE_NAME } from "@/lib/site";

type Props = {
  className?: string;
  /** Show wordmark next to the mark */
  withWordmark?: boolean;
  title?: string;
};

/** Lime “signal peak” mark — distribution gravity as a brand glyph. */
export function BrandMark({
  className = "h-7 w-7",
  withWordmark = false,
  title = SITE_NAME,
}: Props) {
  const mark = (
    <svg
      className={withWordmark ? "h-7 w-7 shrink-0" : className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <rect width="32" height="32" rx="6" fill="var(--bg-elevated)" />
      <rect
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="5.5"
        stroke="var(--line)"
      />
      <path
        d="M5 23 L11 15 L16 19 L22 9 L27 14"
        stroke="var(--accent)"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="22" cy="9" r="2.25" fill="var(--accent)" />
    </svg>
  );

  if (!withWordmark) return mark;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {mark}
      <span className="font-display text-lg font-bold tracking-tight">
        {SITE_NAME}
      </span>
    </span>
  );
}
