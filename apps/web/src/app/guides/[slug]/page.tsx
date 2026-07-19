import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import {
  MarketingPageHero,
  MarketingSection,
} from "@/components/MarketingPage";
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
    <article>
      <JsonLd
        data={articleJsonLd({
          title: g.title,
          description: g.excerpt,
          path: `/guides/${g.slug}`,
          date: "2026-07-18",
        })}
      />
      <MarketingPageHero
        narrow
        label="Playbook"
        title={g.title}
        lead={g.excerpt}
        actions={
          <>
            <Link href="/app/studio" className="btn-primary focus-ring text-base">
              Open Studio
            </Link>
            <Link href="/get-started" className="btn-ghost focus-ring text-base">
              Get started
            </Link>
          </>
        }
      >
        <Link
          href="/guides"
          className="text-sm text-accent hover:underline focus-ring"
        >
          ← Guides
        </Link>
      </MarketingPageHero>

      <MarketingSection flush>
        <ol className="stagger max-w-2xl list-decimal space-y-5 pl-5 text-muted">
          {g.bullets.map((b) => (
            <li key={b} className="pl-1">
              <span className="text-base leading-relaxed text-ink">{b}</span>
            </li>
          ))}
        </ol>
      </MarketingSection>
    </article>
  );
}
