import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { guides } from "@/content/guides";
import { articleJsonLd, pageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = guides.find((x) => x.slug === slug);
  if (!g) return { title: "Guide" };
  return pageMetadata({
    title: g.title,
    description: g.excerpt,
    path: `/guides/${g.slug}`,
    type: "article",
  });
}

export default async function GuideSlugPage({ params }: Props) {
  const { slug } = await params;
  const g = guides.find((x) => x.slug === slug);
  if (!g) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <JsonLd
        data={articleJsonLd({
          title: g.title,
          description: g.excerpt,
          path: `/guides/${g.slug}`,
          date: "2026-07-18",
        })}
      />
      <Link href="/guides" className="text-sm text-muted hover:text-accent">
        ← Guides
      </Link>
      <p className="section-label mt-6 mb-2">Playbook</p>
      <h1 className="font-display text-4xl font-bold tracking-tight">{g.title}</h1>
      <p className="mt-4 text-lg text-muted">{g.excerpt}</p>
      <ol className="mt-10 list-decimal space-y-4 pl-5 text-muted">
        {g.bullets.map((b) => (
          <li key={b} className="pl-1">
            <span className="text-ink">{b}</span>
          </li>
        ))}
      </ol>
      <div className="mt-12 flex flex-wrap gap-3">
        <Link href="/app/studio" className="btn-primary focus-ring">
          Open Studio
        </Link>
        <Link href="/get-started" className="btn-ghost focus-ring">
          Get started
        </Link>
      </div>
    </article>
  );
}
