export type Feature = {
  id: string;
  name: string;
  tagline: string;
  body: string;
  href?: string;
  hrefLabel?: string;
  status: "live" | "app" | "addon";
};

/** Marketing product features — homepage + /product share this list. */
export const FEATURES: Feature[] = [
  {
    id: "brand-memory",
    name: "Brand memory",
    tagline: "URL in. Voice, ICP, pillars out.",
    body: "Onboard with a product or business URL. We extract ICP, tone, and pillars for SaaS, startups, and MSMEs so every draft stays on-voice.",
    href: "/app/onboarding",
    hrefLabel: "Start onboarding",
    status: "app",
  },
  {
    id: "agent-fleet",
    name: "Agent fleet",
    tagline: "Roles across the marketing loop.",
    body: "Strategist, Content, Distributor, SEO/AEO, Growth, and Analyst — specialized agents for goals, drafts, publishing, rankings, loops, and learning.",
    href: "/product#fleet",
    hrefLabel: "See roles",
    status: "live",
  },
  {
    id: "operating-loop",
    name: "Operating loop",
    tagline: "SENSE → THINK → CREATE → GATE → ACT → LEARN",
    body: "One closed loop from channel scan to outcome learning. Not a calendar. Not a chat box. Agents move work through the stages with memory at every step.",
    href: "/product#loop",
    hrefLabel: "How it works",
    status: "live",
  },
  {
    id: "studio",
    name: "Studio",
    tagline: "Drafts from brand context.",
    body: "Generate a 7-day campaign brief plus channel-ready posts from memory — X, LinkedIn, Reddit. Edit in the HITL queue before anything queues to publish. Google Business Profile coming soon.",
    href: "/app/studio",
    hrefLabel: "Open Studio",
    status: "app",
  },
  {
    id: "hitl-queue",
    name: "HITL approval queue",
    tagline: "Autonomy with a human gate.",
    body: "Set how far agents can go per channel. High-risk engages always stop. Approve or reject drafts before they hit the wire.",
    href: "/app/queue",
    hrefLabel: "Open queue",
    status: "app",
  },
  {
    id: "connectors",
    name: "Connectors",
    tagline: "Channels you can connect.",
    body: "Start with Reddit (easiest founder/MSME channel), then X and LinkedIn via managed OAuth. Coming soon stays labeled — Google Business Profile included.",
    href: "/app/connectors",
    hrefLabel: "Connect accounts",
    status: "live",
  },
  {
    id: "seo-aeo",
    name: "SEO / AEO",
    tagline: "Rankings and LLM citations.",
    body: "Structure, guides, sitemap, robots, and llms.txt so humans and models can find you. Distribution includes being citeable.",
    href: "/llms.txt",
    hrefLabel: "View llms.txt",
    status: "live",
  },
  {
    id: "sandbox-security",
    name: "Sandboxed execution",
    tagline: "Untrusted data never becomes a tool call.",
    body: "Scraped pages, decks, and skill files are stored and cited as data. Publishing runs under rate limits with HITL gates — brand safety is the product.",
    href: "/product#trust",
    hrefLabel: "Security posture",
    status: "live",
  },
  {
    id: "vc-brain",
    name: "VC Brain",
    tagline: "Same engine. Sourcing head.",
    body: "Find and screen founders by distribution gravity — 3-axis scoring, Trust Scores, evidence memos, and a clear $100K recommendation.",
    href: "/vc-brain",
    hrefLabel: "Explore VC Brain",
    status: "addon",
  },
  {
    id: "gravity-audit",
    name: "Distribution Gravity Audit",
    tagline: "Free score. Same math.",
    body: "Paste a GitHub handle or public signals and get a cold-start-friendly gravity score from the same engine that powers VC Brain. Not investment advice.",
    href: "/tools/gravity-audit",
    hrefLabel: "Run free audit",
    status: "live",
  },
];

export const FLEET_ROLES = [
  {
    role: "Strategist",
    job: "Owns goals, calendar, and channel mix from brand memory.",
  },
  {
    role: "Content",
    job: "Drafts posts, threads, and landing copy in your voice.",
  },
  {
    role: "Distributor",
    job: "Publishes and engages within platform rate limits.",
  },
  {
    role: "SEO / AEO",
    job: "Earns rankings and LLM citations — structure, guides, llms.txt.",
  },
  {
    role: "Growth",
    job: "Runs loops: Reddit opportunities, launches, waitlist funnels.",
  },
  {
    role: "Analyst",
    job: "Reports what worked; feeds LEARN so context never resets.",
  },
] as const;
