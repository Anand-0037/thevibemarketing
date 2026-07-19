import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Distribution Gravity Audit",
  path: "/tools/gravity-audit",
  description:
    "Free tool: score public distribution gravity from a GitHub handle or signals. Same engine as VC Brain — not investment advice.",
  keywords: ["distribution gravity", "founder score", "GitHub gravity audit"],
});

export default function GravityAuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
