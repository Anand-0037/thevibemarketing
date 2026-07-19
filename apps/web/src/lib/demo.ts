/**
 * Demo / dogfood prefills (Anand operator data).
 * Off in production unless NEXT_PUBLIC_DEMO_DEFAULTS=1.
 * On in local/dev unless NEXT_PUBLIC_DEMO_DEFAULTS=0.
 */
export function demoDefaultsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_DEMO_DEFAULTS?.trim();
  if (v === "1") return true;
  if (v === "0") return false;
  return process.env.NODE_ENV !== "production";
}
