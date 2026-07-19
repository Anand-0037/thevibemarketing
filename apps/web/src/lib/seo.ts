import type { Metadata } from "next";
import {
  KEYWORDS,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_NAME,
  SITE_TAGLINE,
  siteUrl,
} from "@/lib/site";

export function pageMetadata(opts: {
  title: string;
  description?: string;
  path: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  noIndex?: boolean;
}): Metadata {
  const description = opts.description ?? SITE_DESCRIPTION;
  const url = siteUrl(opts.path);
  const title =
    opts.title === SITE_NAME
      ? `${SITE_NAME} — ${SITE_TAGLINE}`
      : opts.title;

  return {
    title: opts.title,
    description,
    keywords: [...KEYWORDS, ...(opts.keywords ?? [])],
    alternates: { canonical: url },
    openGraph: {
      type: opts.type ?? "website",
      url,
      siteName: SITE_NAME,
      title,
      description,
      locale: "en_US",
      ...(opts.publishedTime
        ? { publishedTime: opts.publishedTime }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: opts.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    logo: siteUrl("/brand/logo.svg"),
    email: SITE_EMAIL,
    description: SITE_DESCRIPTION,
    sameAs: [siteUrl("/llms.txt")].filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl("/blog")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function softwareJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl(),
    description: SITE_DESCRIPTION,
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "49",
      highPrice: "149",
      priceCurrency: "USD",
      offerCount: "3",
    },
    featureList: [
      "HITL marketing agent fleet",
      "HITL autonomy dial",
      "SEO and AEO loops",
      "VC Brain distribution-gravity founder sourcing",
      "Multi-platform connectors",
    ],
  };
}

export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  path: string;
  date: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.title,
    description: opts.description,
    datePublished: opts.date,
    dateModified: opts.date,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: {
        "@type": "ImageObject",
        url: siteUrl("/brand/logo.svg"),
      },
    },
    mainEntityOfPage: siteUrl(opts.path),
  };
}
