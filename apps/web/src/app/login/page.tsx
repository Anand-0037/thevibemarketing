import type { Metadata } from "next";
import { AuthForm } from "@/components/AuthForm";
import { isAuthConfigured, safeNextPath } from "@/lib/supabase/config";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Sign in",
  path: "/login",
  description: "Sign in with Google or email and password.",
});

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  return (
    <>
      {sp.error ? (
        <p className="mx-auto max-w-md px-4 pt-8 text-sm text-danger" role="alert">
          Sign-in failed. Try again.
        </p>
      ) : null}
      <AuthForm mode="login" next={next} authReady={isAuthConfigured()} />
    </>
  );
}
