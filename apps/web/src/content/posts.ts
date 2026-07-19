import { DOGFOOD_OPERATOR } from "@/content/dogfood-operator";

export type PostBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "callout"; text: string; tone?: "accent" | "muted" | "warn" }
  | { type: "ol"; items: string[] }
  | {
      type: "mermaid";
      code: string;
      title?: string;
      caption?: string;
    }
  | {
      type: "layers";
      layers: Array<{ name: string; detail: string; accent?: boolean }>;
      title?: string;
      caption?: string;
    }
  | {
      type: "pipeline";
      steps: Array<{ label: string; detail?: string }>;
      title?: string;
      caption?: string;
      orientation?: "auto" | "vertical";
    };

export type Post = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  /** Plain paragraphs for RSS / feeds / fallback */
  body: string[];
  /** Rich article body — diagrams, headings, callouts */
  blocks?: PostBlock[];
  tag?: string;
  author?: string;
};

function blocksToBody(blocks: PostBlock[]): string[] {
  return blocks
    .filter((b): b is { type: "p"; text: string } => b.type === "p")
    .map((b) => b.text);
}

export function postHasDiagram(post: Post): boolean {
  return Boolean(
    post.blocks?.some(
      (b) => b.type === "mermaid" || b.type === "layers" || b.type === "pipeline",
    ),
  );
}

export function postBlocks(post: Post): PostBlock[] {
  if (post.blocks?.length) return post.blocks;
  return post.body.map((text) => ({ type: "p" as const, text }));
}

const ENGINE_TWO_HEADS = `
flowchart TB
  IN[Ingest public signals] --> MEM[Memory never resets]
  MEM --> REA[Reason scores and Trust]
  REA --> TR[Traces step evidence]
  REA --> MKT[Marketing head HITL publish]
  REA --> VC[VC Brain head 100K memo]
`.trim();

const DUAL_WRITE = `
flowchart LR
  API[Next.js API routes] --> STORE[In-memory store]
  API --> PG[(Postgres dual-write)]
  STORE --> UI[Radar · Studio · Memo]
  PG --> UI
`.trim();

const FLEET_LOOP = `
flowchart LR
  S[SENSE] --> T[THINK]
  T --> C[CREATE]
  C --> G[GATE]
  G --> A[ACT]
  A --> L[LEARN]
  L --> S
`.trim();

const VC_SPINE = `
sequenceDiagram
  participant R as Radar
  participant I as Identify
  participant S as Screen
  participant D as Diligence
  participant M as Memo
  R->>I: GH · HN · arXiv
  I->>S: Founder Score + gravity
  Note over S: 3 axes · never averaged
  S->>D: claims + Trust
  D->>M: YES / NO / WATCH + gaps
`.trim();

const THREE_AXIS = `
flowchart TB
  FS[Founder Score ledger] --> A1[Axis 1 · Team]
  FS --> A2[Axis 2 · Market]
  FS --> A3[Axis 3 · Traction]
  A1 --> DEC{Decision support}
  A2 --> DEC
  A3 --> DEC
  DEC --> YES[YES]
  DEC --> NO[NO]
  DEC --> WATCH[WATCH]
`.trim();

const MEMORY_GRAPH = `
flowchart TB
  SIG[Signals · append-only] --> FS[Founder Score ledger]
  CLA[Claims · Trust] --> FS
  SCR[Screenings] --> MEMO[$100K memo]
  FS --> SCR
  CLA --> MEMO
  TR[Agent traces] --> MEMO
`.trim();

const GRAVITY_FLOW = `
flowchart LR
  PUB[Public surfaces] --> G[Gravity score]
  G --> C[Cadence]
  G --> CO[Coherence]
  G --> TR[Track record*]
  C --> FS[Founder Score]
  CO --> FS
  TR --> FS
`.trim();

export const posts: Post[] = [
  {
    title: "Inside the architecture: one engine, two heads",
    slug: "architecture-one-engine-two-heads",
    date: "2026-07-19",
    tag: "architecture",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "How vibemarketer shares Memory, scoring, and traces between the marketing fleet and VC Brain — with diagrams.",
    body: [],
    blocks: [
      {
        type: "p",
        text: "Most products bolt AI onto a calendar or a CRM. We built a shared engine first: ingest public signal, persist Memory, reason with deterministic scores, and leave an agent trace. Then we attached two heads — marketing for SaaS founders, VC Brain for investors.",
      },
      {
        type: "callout",
        tone: "accent",
        text: "Challenge 02 judges care about the sourcing head. The company bet is that the same distribution math that finds founders also builds distribution for them.",
      },
      { type: "h2", text: "System map" },
      {
        type: "mermaid",
        title: "Mermaid · shared engine",
        caption:
          "Ingest and Memory are shared. Heads only differ at the last mile: publish a draft vs write a $100K decision-support memo.",
        code: ENGINE_TWO_HEADS,
      },
      {
        type: "layers",
        title: "Brief pillars → product layers",
        caption:
          "Mapped from The VC Brain brief: Memory · Intelligence · Experience. Marketing reuses the same stack with a HITL gate.",
        layers: [
          {
            name: "Memory",
            detail:
              "Signals, Founder Score history, brand context, claims. Append-only where it matters — Postgres dual-write when enabled.",
            accent: true,
          },
          {
            name: "Intelligence",
            detail:
              "Distribution gravity, 3-axis screening (never averaged), per-claim Trust, thesis fit, conviction thresholds.",
          },
          {
            name: "Experience",
            detail:
              "Radar → compare → screen theater → memo for investors. Studio → HITL queue for the marketing fleet.",
          },
        ],
      },
      { type: "h2", text: "Request path and persistence" },
      {
        type: "p",
        text: "Demo mode can run entirely in-process. When DATABASE_URL is set, the same write path dual-writes to Postgres so Radar, memos, and traces survive restarts — without inventing a second source of truth for the UI.",
      },
      {
        type: "mermaid",
        title: "Mermaid · dual-write",
        caption:
          "Store stays the fast read path for the hackathon demo. Postgres is the durable ledger when configured.",
        code: DUAL_WRITE,
      },
      {
        type: "pipeline",
        title: "Pipeline · investor spine",
        caption: "Five screens judges can walk without a script.",
        steps: [
          { label: "Identify", detail: "GH · HN · arXiv" },
          { label: "Score", detail: "Gravity + Founder Score" },
          { label: "Screen", detail: "3 axes, never averaged" },
          { label: "Diligence", detail: "Claims + Trust probes" },
          { label: "Memo", detail: "$100K YES / NO / WATCH" },
        ],
      },
      { type: "h2", text: "Why this shape wins the hackathon and the company" },
      {
        type: "ol",
        items: [
          "Sourcing depth lives in connectors + Memory — not in a single LLM call.",
          "Trust is claim-level with contradictions; memos flag Cap table: not disclosed instead of inventing numbers.",
          "The marketing head dogfoods the same loop: drafts, gates, learns.",
        ],
      },
      {
        type: "p",
        text: "If you only remember one picture from this post, remember the fork after Reason: same evidence spine, two action vocabularies.",
      },
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
    body: [],
    blocks: [
      {
        type: "p",
        text: "Hackathons reward a sharp demo. We shipped VC Brain: thesis → multi-source ingest → distribution gravity → 3-axis screen (never averaged) → per-claim Trust → $100K memo with traces. Judges can walk the spine in five minutes.",
      },
      {
        type: "mermaid",
        title: "Mermaid · investor path",
        caption:
          "Live Identify feeds Memory. Screening and Diligence are separate steps — Trust can kill a YES before the memo.",
        code: VC_SPINE,
      },
      {
        type: "p",
        text: "The real bet is bigger. The same ingest → memory → reason → act loop that sources founders can manufacture distribution for SaaS. Marketing fleet creates attention; VC Brain measures it.",
      },
      { type: "h2", text: "Three axes, never averaged" },
      {
        type: "mermaid",
        title: "Mermaid · decision support",
        caption:
          "Team, market, and traction stay separate so a charismatic pitch cannot wash out a weak market.",
        code: THREE_AXIS,
      },
      {
        type: "layers",
        title: "What ships in the 24h demo",
        layers: [
          {
            name: "Identify",
            detail: "GitHub · Hacker News · arXiv only. No fabricated Product Hunt cast.",
            accent: true,
          },
          {
            name: "Conviction",
            detail:
              "When gravity / Founder Score crosses threshold, auto-screen (capped) so the fund feels like it runs itself.",
          },
          {
            name: "Decision support",
            detail:
              "$100K YES/NO/WATCH with Appendix gaps and a due diligence log — not an automated wire.",
          },
        ],
      },
      {
        type: "pipeline",
        title: "Pipeline · judge walkthrough",
        steps: [
          { label: "Thesis", detail: "Set what you fund" },
          { label: "Radar", detail: "Live public signal" },
          { label: "Compare", detail: "Side-by-side axes" },
          { label: "Memo", detail: "Traceable decision" },
        ],
      },
      {
        type: "p",
        text: `I'm dogfooding it as ${DOGFOOD_OPERATOR.name} — portfolio at 0xanand.tech, building in public on X. The fleet drafts; HITL gates; the blog is proof the product works on itself.`,
      },
      {
        type: "p",
        text: "If you are a technical founder drowning in 'just post more,' start at Gravity Audit, then open the app. Distribution is infrastructure. We're building the OS.",
      },
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
    body: [],
    blocks: [
      {
        type: "p",
        text: "Algorithms change. Your email list does not — if you earn the open. For indie SaaS, a weekly distribution note beats another viral template that dies in 48 hours.",
      },
      {
        type: "pipeline",
        title: "Pipeline · owned attention",
        caption: "Capture → draft from brand memory → HITL → send → learn opens.",
        steps: [
          { label: "Capture", detail: "Waitlist + source tag" },
          { label: "Draft", detail: "Brand memory voice" },
          { label: "Gate", detail: "HITL at L1" },
          { label: "Send", detail: "Owned inbox" },
          { label: "Learn", detail: "ESP analytics later" },
        ],
      },
      {
        type: "p",
        text: "Inside vibemarketer, newsletter is not a bolted-on form. Captures feed the same waitlist store with a source tag; drafts pull brand memory; HITL still gates send when autonomy is L1.",
      },
      {
        type: "mermaid",
        title: "Mermaid · fleet loop",
        caption: "Newsletter is CREATE + GATE + ACT on a slower cadence — not a separate product.",
        code: FLEET_LOOP,
      },
      {
        type: "callout",
        tone: "muted",
        text: "Start simple: one promise (distribution notes for builders), one cadence, one unsubscribe that actually works. Then let LEARN improve subject lines from real opens when ESP analytics are wired.",
      },
      {
        type: "p",
        text: "Subscribe at /newsletter. Prefer product access? Join the waitlist. Either way you are building owned attention, not renting someone else's feed.",
      },
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
    body: [],
    blocks: [
      {
        type: "p",
        text: "Cold-start founders have no Crunchbase page, thin LinkedIn, and a GitHub that does not scream pedigree. Traditional VC tooling over-indexes on track record and quietly re-creates network bias.",
      },
      {
        type: "p",
        text: "We score distribution gravity instead: earned attention velocity relative to follower base, narrative coherence across platforms, audience-pull versus push, and builder-in-public cadence. Punches-above-weight beats absolute size.",
      },
      {
        type: "mermaid",
        title: "Mermaid · gravity into Founder Score",
        caption:
          "*Track record is optional. In cold-start mode its weight redistributes — labeled in the UI, never silently zeroed against first-timers.",
        code: GRAVITY_FLOW,
      },
      {
        type: "mermaid",
        title: "Mermaid · Memory never forgets",
        caption:
          "Founder Score is a ledger. Opportunity scores (3 axes) are per company. Claims feed Trust into the memo.",
        code: MEMORY_GRAPH,
      },
      {
        type: "layers",
        title: "What gravity looks at",
        layers: [
          {
            name: "Velocity / size",
            detail: "Earned attention relative to follower base — not raw vanity counts.",
            accent: true,
          },
          {
            name: "Coherence",
            detail: "Same narrative across GH, HN, posts — not a new persona every week.",
          },
          {
            name: "Cadence",
            detail: "Builder-in-public rhythm the market can underwrite.",
          },
        ],
      },
      {
        type: "callout",
        tone: "warn",
        text: "When track record is missing, weight redistributes into gravity / cadence / coherence — we do not punish first-timers with a zero. That is cold-start mode, labeled in the UI.",
      },
      {
        type: "p",
        text: "That same public-surface engine powers VC Brain — ingest, memory, evidence, then an action head that writes a memo instead of a post. One engine, swappable heads.",
      },
      {
        type: "p",
        text: "If capital should flow on merit, the system has to see founders the way the market already does: by who is earning attention, not who already raised.",
      },
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
    body: [],
    blocks: [
      {
        type: "p",
        text: "Most AI marketing tools generate text. That is useful and incomplete. Agentic marketing means a system that can run a multi-step loop: sense public surfaces, decide what matters for your ICP, act across channels, and learn what worked into persistent brand memory.",
      },
      {
        type: "mermaid",
        title: "Mermaid · operating loop",
        caption:
          "GATE is not optional theater — autonomy L1–L3 decides how far ACT can go before a human.",
        code: FLEET_LOOP,
      },
      {
        type: "pipeline",
        title: "Pipeline · autonomy dial",
        caption: "Same fleet. Different permission to leave the queue.",
        steps: [
          { label: "L1", detail: "Draft only" },
          { label: "L2", detail: "Approve to publish" },
          { label: "L3", detail: "Supervised engage" },
        ],
      },
      {
        type: "layers",
        title: "Fleet roles",
        layers: [
          {
            name: "Strategist",
            detail: "Goals, calendar, channel mix from brand memory.",
          },
          {
            name: "Content",
            detail: "Drafts posts and threads in your voice.",
            accent: true,
          },
          {
            name: "Distributor",
            detail: "Publishes and engages within rate limits — after HITL.",
          },
          {
            name: "Analyst",
            detail: "Feeds LEARN so context never resets every session.",
          },
        ],
      },
      {
        type: "p",
        text: "Autonomy without control is brand risk. That is why the HITL dial matters — draft-only, approve-to-publish, or supervised engage. Human-in-the-loop is a product feature, not an apology for incomplete automation.",
      },
      {
        type: "p",
        text: "The connectors matter as much as the model. Founder channels — Reddit, Hacker News, X, LinkedIn — are where early customers live. A fleet that cannot operate there is a writing assistant with a fancy label.",
      },
    ],
  },
  {
    title: "Distribution is the new scarcity",
    slug: "distribution-is-the-new-scarcity",
    date: "2026-07-12",
    tag: "thesis",
    author: DOGFOOD_OPERATOR.name,
    excerpt:
      "AI collapsed the cost of building. Attention did not get cheaper — so the bottleneck moved.",
    body: [],
    blocks: [
      {
        type: "p",
        text: "A decade ago, shipping a SaaS product took a team and a runway. Today a solo founder can vibe-code a working MVP in a weekend. The hard part is no longer the build — it is getting strangers to care.",
      },
      {
        type: "layers",
        title: "Where the bottleneck moved",
        layers: [
          {
            name: "Build cost",
            detail: "Collapsed — models, templates, and weekend MVPs.",
          },
          {
            name: "Attention cost",
            detail: "Did not — feeds are louder, trust is thinner.",
            accent: true,
          },
          {
            name: "Operating system",
            detail: "Missing — most founders still treat distribution as a side quest.",
          },
        ],
      },
      {
        type: "p",
        text: "When everyone can ship, distribution becomes the scarce resource. Followers, SEO, Product Hunt timing, Reddit credibility, and earned replies on X are not nice-to-haves. They are the difference between a dead repo and a real business.",
      },
      {
        type: "mermaid",
        title: "Mermaid · one loop, two products",
        caption:
          "vibemarketer manufactures attention. VC Brain measures who already earns it. Same Memory spine.",
        code: ENGINE_TWO_HEADS,
      },
      {
        type: "pipeline",
        title: "Pipeline · from thesis to habit",
        steps: [
          { label: "Sense", detail: "Public surfaces" },
          { label: "Decide", detail: "ICP + gravity" },
          { label: "Act", detail: "HITL-gated" },
          { label: "Remember", detail: "Brand + founder ledger" },
        ],
      },
      {
        type: "p",
        text: "That is why we built vibemarketer as an agent fleet: strategy, creation, distribution, and learning in one loop with memory that does not reset every session. Schedulers move posts. Agents own outcomes.",
      },
      {
        type: "p",
        text: "If you are a technical founder who can build but cannot market, the gap is not motivation — it is operating system. Treat distribution like infrastructure, not a side quest.",
      },
    ],
  },
];

// Keep body[] filled for RSS when only blocks were authored
for (const post of posts) {
  if (post.blocks?.length && post.body.length === 0) {
    post.body = blocksToBody(post.blocks);
  }
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}

export function postsSorted(): Post[] {
  return [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
}
