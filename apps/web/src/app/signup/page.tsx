import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { isAuthConfigured, safeNextPath } from "@/lib/supabase/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign up",
  path: "/signup",
  description: "Create an account with Google or email and password.",
});

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  return <AuthForm mode="signup" next={next} authReady={isAuthConfigured()} />;
}
