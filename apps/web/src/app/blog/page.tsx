import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/MarketingPage";
import { WaitlistForm } from "@/components/WaitlistForm";
import { postHasDiagram, postsSorted } from "@/content/posts";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog",
  path: "/blog",
  description:
    "Notes on autonomous marketing fleets, distribution gravity, architecture diagrams, and agentic GTM for SaaS founders.",
});

export default function BlogPage() {
  const posts = postsSorted();

  return (
    <>
      <MarketingPageHero
        narrow
        label="Writing"
        title="Blog"
        lead="Architecture notes, Mermaid system maps, and build-in-public writing from the marketing fleet + VC Brain — dogfooded by the same engine."
        actions={
          <Link href="/newsletter" className="btn-ghost focus-ring text-base">
            Newsletter →
          </Link>
        }
      />

      <MarketingSection>
        <ul className="stagger space-y-0">
          {posts.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group focus-ring block border-t border-line py-8"
              >
                <p className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  <span>
                    {p.date}
                    {p.tag ? ` · ${p.tag}` : ""}
                  </span>
                  {postHasDiagram(p) ? (
                    <span className="border border-accent/40 px-1.5 py-0.5 text-accent">
                      diagrams
                    </span>
                  ) : null}
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight group-hover:text-accent sm:text-3xl">
                  {p.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                  {p.excerpt}
                </p>
                {p.author ? (
                  <p className="mt-3 font-mono text-[10px] text-muted">
                    {p.author}
                  </p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      </MarketingSection>

      <MarketingSection flush>
        <MarketingSectionHeading
          label="Newsletter"
          title="Get distribution notes in your inbox"
          lead="Same writing, less feed noise. Or join the product waitlist for fleet seats."
        />
        <div className="panel max-w-2xl border-accent/30 p-6">
          <WaitlistForm source="blog" cta="Subscribe from blog" compact />
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/newsletter" className="text-accent hover:underline">
              Newsletter page
            </Link>
            <Link href="/#waitlist" className="text-accent hover:underline">
              Product waitlist
            </Link>
            <Link
              href="/tools/gravity-audit"
              className="text-accent hover:underline"
            >
              Gravity Audit
            </Link>
          </div>
        </div>
      </MarketingSection>
    </>
  );
}
