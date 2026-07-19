import type { NextConfig } from "next";
import { assertProductionAuthSafe } from "./src/lib/supabase/config";

// Env: repo-root `.env` is symlinked to `apps/web/.env` so Next loads keys.
// Build-time rail: refuse AUTH_BYPASS=1 in production; hosted prod needs Supabase.
assertProductionAuthSafe();

const nextConfig: NextConfig = {
  transpilePackages: ["@vibe/engine"],
  // Keep /demo as the product tour page (do not redirect away).
};

export default nextConfig;
