import type { Metadata } from "next";
import Link from "next/link";
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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label mb-2">Writing</p>
          <h1 className="font-display text-4xl font-bold tracking-tight">
            Blog
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Architecture notes, Mermaid system maps, and build-in-public writing
            from the marketing fleet + VC Brain — dogfooded by the same engine.
          </p>
        </div>
        <Link
          href="/newsletter"
          className="text-sm text-accent hover:underline focus-ring"
        >
          Newsletter →
        </Link>
      </div>

      <ul className="mt-12 space-y-8">
        {posts.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/blog/${p.slug}`}
              className="group block border-b border-line pb-8 focus-ring"
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
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight group-hover:text-accent">
                {p.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
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

      <div className="panel mt-14 border-accent/30 p-6">
        <p className="section-label mb-2">Newsletter</p>
        <h2 className="font-display text-xl font-semibold">
          Get distribution notes in your inbox
        </h2>
        <p className="mt-2 text-sm text-muted">
          Same writing, less feed noise. Or join the product waitlist for fleet
          seats.
        </p>
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
    </div>
  );
}
