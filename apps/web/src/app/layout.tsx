import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Sans, Syne } from "next/font/google";
import { AuthBypassBanner } from "@/components/AuthBypassBanner";
import { Footer } from "@/components/Footer";
import { JsonLd } from "@/components/JsonLd";
import { Nav } from "@/components/Nav";
import {
  KEYWORDS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
  siteUrl,
} from "@/lib/site";
import { organizationJsonLd, softwareJsonLd, websiteJsonLd } from "@/lib/seo";
import "./globals.css";

const instrument = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b0d10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Autonomous AI Marketing Fleet`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: siteUrl() }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "technology",
  keywords: [...KEYWORDS],
  metadataBase: new URL(siteUrl()),
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": siteUrl("/rss.xml"),
      "application/x-ndjson": siteUrl("/feed.jsonl"),
      "text/plain": siteUrl("/llms.txt"),
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon" }],
  },
  manifest: "/manifest.webmanifest",
  other: {
    "llms-txt": siteUrl("/llms.txt"),
    "ai-content": "llms.txt; llms-full.txt; feed.jsonl",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrument.variable} ${syne.variable} ${geistMono.variable} h-full`}
    >
      <head>
        <link rel="author" href="/humans.txt" />
        <link
          rel="alternate"
          type="text/plain"
          href="/llms.txt"
          title="llms.txt"
        />
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${SITE_NAME} Blog RSS`}
          href="/rss.xml"
        />
        <link
          rel="alternate"
          type="application/x-ndjson"
          title="AEO feed"
          href="/feed.jsonl"
        />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <JsonLd data={softwareJsonLd()} />
      </head>
      <body className="flex min-h-full flex-col antialiased">
        <a href="#main-content" className="skip-link focus-ring">
          Skip to main content
        </a>
        <AuthBypassBanner />
        <Nav />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
