import { DOGFOOD_OPERATOR } from "@/content/dogfood-operator";

export type Post = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  body: string[];
  tag?: string;
  author?: string;
};

export const posts: Post[] = [
  {
    title: "Distribution is the new scarcity",
    slug: "distribution-is-the-new-scarcity",
    date: "2026-07-12",
    tag: "thesis",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "AI collapsed the cost of building. Attention did not get cheaper — so the bottleneck moved.",
    body: [
      "A decade ago, shipping a SaaS product took a team and a runway. Today a solo founder can vibe-code a working MVP in a weekend. The hard part is no longer the build — it is getting strangers to care.",
      "When everyone can ship, distribution becomes the scarce resource. Followers, SEO, Product Hunt timing, Reddit credibility, and earned replies on X are not nice-to-haves. They are the difference between a dead repo and a real business.",
      "That is why we built thevibemarketing as an agent fleet: strategy, creation, distribution, and learning in one loop with memory that does not reset every session. Schedulers move posts. Agents own outcomes.",
      "If you are a technical founder who can build but cannot market, the gap is not motivation — it is operating system. Treat distribution like infrastructure, not a side quest.",
    ],
  },
  {
    title: "What agentic marketing actually means",
    slug: "what-agentic-marketing-actually-means",
    date: "2026-07-14",
    tag: "product",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "Not another copywriter. Not a calendar. A fleet that senses, decides, acts, and learns — with a human on the dial.",
    body: [
      "Most AI marketing tools generate text. That is useful and incomplete. Agentic marketing means a system that can run a multi-step loop: sense public surfaces, decide what matters for your ICP, act across channels, and learn what worked into persistent brand memory.",
      "Autonomy without control is brand risk. That is why the HITL dial matters — draft-only, approve-to-publish, or supervised engage. GATE is always available. Human-in-the-loop is a product feature, not an apology for incomplete automation.",
      "The connectors matter as much as the model. Founder channels — Reddit, Product Hunt, Hacker News, X, LinkedIn, Substack — are where early customers live. A fleet that cannot operate there is a writing assistant with a fancy label.",
      "Agentic marketing is the category we are building toward: outcomes owned by agents, voice protected by memory, and humans deciding how far the fleet can go.",
    ],
  },
  {
    title: "How cold-start founders get found",
    slug: "how-cold-start-founders-get-found",
    date: "2026-07-16",
    tag: "vc-brain",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "Pedigree scrapers miss the people who matter. Distribution gravity is how you score founders before the network does.",
    body: [
      "Cold-start founders have no Crunchbase page, thin LinkedIn, and a GitHub that does not scream pedigree. Traditional VC tooling over-indexes on track record and quietly re-creates network bias.",
      "We score distribution gravity instead: earned attention velocity relative to follower base, narrative coherence across platforms, audience-pull versus push, and builder-in-public cadence. Punches-above-weight beats absolute size.",
      "That same public-surface engine powers VC Brain — ingest, memory, evidence, then an action head that writes a memo instead of a post. One engine, swappable heads.",
      "If capital should flow on merit, the system has to see founders the way the market already does: by who is earning attention, not who already raised.",
    ],
  },
  {
    title: "We built a VC Brain in 18 hours — then put it inside the product",
    slug: "vc-brain-in-18-hours",
    date: "2026-07-18",
    tag: "build-in-public",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "Hack-Nation Challenge 02 was the wedge. The company is Cursor for marketing — same engine, two heads.",
    body: [
      "Hackathons reward a sharp demo. We shipped VC Brain: thesis → multi-source ingest → distribution gravity → 3-axis screen (never averaged) → per-claim Trust → $100K memo with traces. Judges can walk the spine in five minutes.",
      "The real bet is bigger. The same ingest → memory → reason → act loop that sources founders can manufacture distribution for SaaS. Marketing fleet creates attention; VC Brain measures it. One engine, swappable heads.",
      "I'm dogfooding it as Anand Vashishtha — portfolio at 0xanand.tech, shipping from Ghaziabad, building in public on X. The fleet drafts; HITL gates; the blog is proof the product works on itself.",
      "If you are a technical founder drowning in 'just post more,' start at Gravity Audit, then join the waitlist. Distribution is infrastructure. We're building the OS.",
    ],
  },
  {
    title: "Why your SaaS needs a newsletter before another growth hack",
    slug: "newsletter-before-growth-hacks",
    date: "2026-07-17",
    tag: "newsletter",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "Rented audiences choke. Owned email compounds. Here's how the fleet treats newsletter as a first-class loop.",
    body: [
      "Algorithms change. Your email list does not — if you earn the open. For indie SaaS, a weekly distribution note beats another viral template that dies in 48 hours.",
      "Inside thevibemarketing, newsletter is not a bolted-on form. Captures feed the same waitlist store with a source tag; drafts pull brand memory; HITL still gates send when autonomy is L1.",
      "Start simple: one promise (distribution notes for builders), one cadence, one unsubscribe that actually works. Then let the Content + LEARN loop improve subject lines from real opens — when you wire ESP analytics.",
      "Subscribe at /newsletter. Prefer product access? Join the waitlist. Either way you are building owned attention, not renting someone else's feed.",
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}

export function postsSorted(): Post[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}
