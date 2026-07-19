import type { Metadata } from "next";
import Link from "next/link";
import { WaitlistForm } from "@/components/WaitlistForm";
import { postsSorted } from "@/content/posts";
import { pageMetadata } from "@/lib/seo";
import { NewsletterOk } from "./NewsletterOk";

export const metadata: Metadata = pageMetadata({
  title: "Newsletter",
  path: "/newsletter",
  description:
    "Distribution notes for builders — agentic marketing, gravity scoring, and launch loops. From vibemarketer.",
});

export default function NewsletterPage() {
  const latest = postsSorted().slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <NewsletterOk />
      <p className="section-label mb-2">Owned audience</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Distribution notes
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Short, technical letters on agentic marketing, cold-start gravity, and
        shipping without a marketer. Written the way the fleet drafts — then
        edited by a human.
      </p>

      <div className="panel mt-10 border-accent/30 p-6">
        <p className="section-label mb-2">Subscribe</p>
        <h2 className="font-display text-xl font-semibold">
          One email when it matters
        </h2>
        <p className="mt-2 text-sm text-muted">
          No daily spam. Launch notes, playbooks, and product drops — unsubscribe
          anytime.
        </p>
        <WaitlistForm source="newsletter" showName cta="Subscribe" />
      </div>

      <section className="mt-14">
        <p className="section-label mb-3">From the blog</p>
        <ul className="space-y-5">
          {latest.map((p) => (
            <li key={p.slug}>
              <Link
                href={`/blog/${p.slug}`}
                className="group block border-b border-line pb-5 focus-ring"
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {p.date}
                  {p.tag ? ` · ${p.tag}` : ""}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold group-hover:text-accent">
                  {p.title}
                </h3>
                <p className="mt-1 text-sm text-muted">{p.excerpt}</p>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/blog"
          className="mt-6 inline-block text-sm text-accent hover:underline"
        >
          All writing →
        </Link>
      </section>

      <p className="mt-12 text-sm text-muted">
        Prefer the product?{" "}
        <Link href="/#waitlist" className="text-accent hover:underline">
          Join the product waitlist
        </Link>{" "}
        or{" "}
        <Link href="/tools/gravity-audit" className="text-accent hover:underline">
          run Gravity Audit free
        </Link>
        .
      </p>
    </div>
  );
}
