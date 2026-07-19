import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogBlocks } from "@/components/BlogBlocks";
import { JsonLd } from "@/components/JsonLd";
import {
  MarketingPageHero,
  MarketingSection,
  MarketingSectionHeading,
} from "@/components/MarketingPage";
import { WaitlistForm } from "@/components/WaitlistForm";
import { DOGFOOD_OPERATOR } from "@/content/dogfood-operator";
import {
  getAllSlugs,
  getPost,
  postHasDiagram,
  postsSorted,
} from "@/content/posts";
import { articleJsonLd, pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Blog" };
  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = postsSorted()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 2);
  const hasDiagram = postHasDiagram(post);

  return (
    <article>
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt,
          path: `/blog/${post.slug}`,
          date: post.date,
        })}
      />
      <MarketingPageHero
        narrow={!hasDiagram}
        label="Writing"
        title={post.title}
        lead={post.excerpt}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/blog" className="text-accent hover:underline focus-ring">
            ← Blog
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {post.date}
            {post.tag ? ` · ${post.tag}` : ""}
          </span>
          {hasDiagram ? (
            <span className="border border-accent/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-accent">
              diagrams
            </span>
          ) : null}
        </div>
        <p className="mt-4 text-sm text-muted">
          {post.author ?? DOGFOOD_OPERATOR.name}
          {" · "}
          <a
            href={DOGFOOD_OPERATOR.x_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            @{DOGFOOD_OPERATOR.x_handle}
          </a>
        </p>
      </MarketingPageHero>

      <MarketingSection>
        <div className={hasDiagram ? "max-w-4xl" : "max-w-3xl"}>
          <BlogBlocks
            blocks={
              post.blocks ?? post.body.map((text) => ({ type: "p" as const, text }))
            }
          />
        </div>
      </MarketingSection>

      <MarketingSection>
        <div className="panel max-w-2xl border-accent/30 p-6">
          <p className="section-label mb-2">Subscribe</p>
          <h2 className="font-display text-xl font-semibold">
            More like this, less feed noise
          </h2>
          <p className="mt-2 text-sm text-muted">
            Newsletter for builders — or open Gravity Audit / the app.
          </p>
          <WaitlistForm source="blog" compact cta="Subscribe" />
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            >
              Open app
            </Link>
            <Link
              href="/vc-brain"
              className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            >
              VC Brain
            </Link>
            <Link
              href="/tools/gravity-audit"
              className="btn-ghost focus-ring !px-3 !py-1.5 text-sm"
            >
              Gravity Audit
            </Link>
          </div>
        </div>
      </MarketingSection>

      {others.length > 0 ? (
        <MarketingSection flush>
          <MarketingSectionHeading label="Keep reading" title="More notes" />
          <ul className="stagger space-y-0">
            {others.map((p) => (
              <li key={p.slug} className="border-t border-line py-5">
                <Link
                  href={`/blog/${p.slug}`}
                  className="font-display text-lg font-semibold text-ink hover:text-accent"
                >
                  {p.title}
                  {postHasDiagram(p) ? (
                    <span className="ml-2 font-mono text-[10px] uppercase tracking-wider text-accent">
                      diagrams
                    </span>
                  ) : null}
                </Link>
                <p className="mt-1 text-sm text-muted">{p.excerpt}</p>
              </li>
            ))}
          </ul>
        </MarketingSection>
      ) : null}
    </article>
  );
}
