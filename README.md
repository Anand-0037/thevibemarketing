# vibemarketer

**Official domain:** [vibemarketer.fun](https://vibemarketer.fun)  
**Repository directory:** `thevibemarketing.online/` (historical path; product name is vibemarketer)

**Cursor for marketing** — an autonomous AI agent fleet that runs a SaaS founder’s marketing department 24/365.  
**VC Brain** — the same engine’s sourcing head: find, screen, and diligence founders by **distribution gravity**, then recommend a **$100K** check within 24 hours.

| | |
|---|---|
| Hackathon track | **Hack-Nation Challenge 02 — The VC Brain** (only track) |
| Team ID | `026f67c5-25af-4105-ae6e-177dd10bc0bb` |
| Product frame | Marketing fleet is the company; VC Brain is a first-class feature (`/vc-brain`, `/app/*`) |
| Planning archive | [`../hack/idea.md`](../hack/idea.md) · [`../hack/STATUS.md`](../hack/STATUS.md) · [`../hack/plan/`](../hack/plan/) |
| Judge / ops docs | [`../hack/project files/JUDGES.md`](../hack/project%20files/JUDGES.md) · [`AUTH.md`](../hack/project%20files/AUTH.md) · [`POSTGRES.md`](../hack/project%20files/POSTGRES.md) |

---

## Problem

Shipping software got cheap. **Distribution did not.**

Founders who can build still stall on Reddit, X, LinkedIn, Product Hunt, SEO/AEO, and brand memory that resets every chat session. Investors, meanwhile, miss cold-start builders whose public footprint already shows earned attention — until a warm intro surfaces them weeks later.

Both problems are the same systems problem: **ingest public signal → persistent memory → evidence-backed reasoning → gated action.**

---

## Solution — one engine, two heads

```
                    vibemarketer.fun
        ┌──────────────────────────────────────────┐
        │  Marketing fleet (main product)            │
        │  brand memory → draft → HITL → publish     │
        └──────────────────┬───────────────────────┘
                           │  @vibe/engine
        ┌──────────────────▼───────────────────────┐
        │  VC Brain (Challenge 02 feature)           │
        │  Identify → Activate → Converge → Screen   │
        │  → Diligence → Decision ($100K memo)       │
        └────────────────────────────────────────────┘
```

1. **Marketing head** — autonomous loops across founder channels with an autonomy dial (L1 HITL → L3 gated auto). Brand memory does not reset.
2. **Sourcing head (VC Brain)** — outbound Identify across GitHub, HN, Product Hunt, arXiv, accelerator cohorts, and hackathons; Activate cold outreach; Converge into the same Screening funnel as inbound apply; score on **three axes never averaged**; Diligence via per-claim Trust; Decision as an evidence memo.

**Distribution gravity** is the unfair angle: velocity of *earned* attention vs pedigree. Thin-track-record founders can outrank quiet, resume-strong profiles when the public footprint warrants it — and the system **abstains** when signal is too thin.

---

## Build vs borrow

From the original thesis in [`hack/idea.md`](../hack/idea.md): borrow playbooks and plumbing; **build the spine**.

### We borrow

| Layer | What | Why |
|-------|------|-----|
| Marketing playbooks | [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills), [realjaymes/marketingagentskills](https://github.com/realjaymes/marketingagentskills), cherry-picks from [alirezarezvani/claude-skills](https://github.com/alirezarezvani/claude-skills) | MIT skill libraries = agent operating manuals (CRO, launch, SEO/AEO, social). We do not reinvent frameworks. |
| Connectors / OAuth | **Composio** | Multi-tenant Connect Links; don’t hand-roll Reddit/X/LinkedIn OAuth. |
| Scrape / map | **Firecrawl** | `map` + markdown scrape; own extraction (credits stay cheap). |
| Brand memory | **Supermemory** | Per-customer `containerTags`; Founder Score stays in our DB. |
| Sandboxes | **E2B** | Isolated `git clone` / forensics for untrusted repos → gravity cadence inputs. |
| LLM | **OpenAI** (`gpt-4.1-nano` default) | Prose / extract only. **Scores stay deterministic TypeScript.** |
| Auth + Postgres | **Supabase** | JWT `getClaims()`, RLS, append-only Memory ledgers. |
| Payments | **Dodo** (optional) | Checkout when keyed; honest waitlist fallback otherwise. |

### We build (owned moat)

- Orchestration spine: ingest → memory → gravity → trust → 3-axis screen → memo → traces  
- Distribution-gravity scorer + Founder Score (persistent, never resets)  
- Diligence / Trust contradiction path + Validator  
- HITL queue, autonomy dial, studio loops  
- Investor UX: radar, gravity compare, ScreeningTheater, ⌘K demo spine  
- Security posture: scraped/uploaded data treated as **untrusted**; E2B isolation; L3 blocked when publish is stub  

**lingo.dev** multi-language site is planned for V1 — not required for the hack submission.

---

## Architecture

```
apps/web          Next.js 16 App Router (UI + API routes)
packages/engine   @vibe/engine — scoring, memory, connectors, agent lanes, memo
data/             seed JSON + local store.json (demo primary)
supabase/         Auth profiles + VC Brain Memory migrations
```

**Runtime contract**

- JSON `MemoryStore` = zero-latency demo path  
- Optional dual-write (`USE_POSTGRES_DUAL=1` + `SUPABASE_SERVICE_ROLE_KEY`) → append-only `signals` + `founder_score_events`  
- Agent lanes (parallel): GitHub · E2B forensics · Tavily · Firecrawl · Supermemory · HN  

**VC Brain pipeline (brief-aligned)**

| Stage | Implementation |
|-------|----------------|
| Sourcing / Identify | `POST /api/ingest` — GH, HN, arXiv, curated PH, accelerators, hackathons |
| Activate → Converge | Founder page outbound funnel → same Screening as inbound |
| Screening | First-pass · gravity · **3 axes never averaged** · thesis fit |
| Diligence | Per-claim Trust · contradiction flags · validator |
| Decision | Evidence memo · $100K yes/no/watch · agent traces |

---

## Demo (judges / video)

Cold open (~5–7 min):

1. [`/demo`](https://vibemarketer.fun/demo) or `/app/compare` — **Maya vs Jordan** gravity inversion  
2. ⌘K → **Screen Sam Rivera** — Diligence contradiction  
3. Open **$100K memo** — axes never averaged · Trust · decision **NO** · agent trace  
4. Optional: Radar **Identify · refresh** · Activate → Converge badge · NL `/app/query`

Synthetic sandbox founders are labeled. Live ingest/E2B light up when keys are present.

---

## Local development

```bash
pnpm install
cp .env.example .env          # fill keys (see below)
pnpm probe:keys               # live health of OpenAI / E2B / Firecrawl / …
pnpm test                     # engine + web smoke (Maya gravity > Jordan)
pnpm smoke:e2b                # live sandbox forensics (optional)
pnpm --filter web dev         # http://localhost:3000
```

### Environment (high level)

| Variable | Role |
|----------|------|
| `NEXT_PUBLIC_SITE_URL` | Canonical URL (`https://vibemarketer.fun` in prod) |
| `NEXT_PUBLIC_SUPABASE_URL` / `…_PUBLISHABLE_KEY` | Auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Server dual-write to Postgres ledgers (never expose to browser) |
| `AUTH_BYPASS` | `0` in prod · soft-open only for local if unset |
| `USE_POSTGRES_DUAL` | `1` to append signals/score events to Supabase |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | Memo polish / drafts (`gpt-4.1-nano`) |
| `E2B_API_KEY` | Team key `e2b_…` for code forensics |
| `FIRECRAWL_API_KEY` / `TAVILY_API_KEY` / `GITHUB_TOKEN` | Enrichment |
| `COMPOSIO_API_KEY` | OAuth connect links |
| `SUPERMEMORY_API_KEY` | Brand memory |

Full template: [`.env.example`](./.env.example). Never commit `.env`.

Supabase schema: `supabase/migrations/` · apply guide in [`../hack/project files/POSTGRES.md`](../hack/project%20files/POSTGRES.md).

---

## Deploy (manual — recommended for submission)

Target: **Netlify** or **Vercel**, custom domain **vibemarketer.fun**.  
Monorepo root is this directory. Build the `web` package; transpile `@vibe/engine`.

### 1) Preflight (local)

```bash
pnpm probe:keys
pnpm test
pnpm --filter web build
```

Confirm SQL migrations applied in Supabase (profiles + VC Brain memory).  
Auth: prefer **Confirm email = off** for demo logins, or confirm one operator account.

### 2) Set production env in the host UI

Copy every key from local `.env` that the app needs at runtime. Critical:

```text
NEXT_PUBLIC_SITE_URL=https://vibemarketer.fun
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=…
SUPABASE_SERVICE_ROLE_KEY=…          # server only
AUTH_BYPASS=0
USE_POSTGRES_DUAL=1
ALLOW_OPEN_APP=                       # leave unset
OPENAI_API_KEY / E2B_API_KEY / FIRECRAWL_API_KEY / …
```

Also configure Supabase Auth → URL configuration:

- Site URL: `https://vibemarketer.fun`  
- Redirect: `https://vibemarketer.fun/auth/callback`

### 3) Netlify (CLI — you run)

```bash
# from repo root: thevibemarketing.online/
npx netlify login
npx netlify init          # create or link site
npx netlify env:import .env   # or paste in UI (strip comments)
# then set NEXT_PUBLIC_SITE_URL=https://vibemarketer.fun in UI

npx netlify deploy --build --prod
```

`netlify.toml` in this repo sets the pnpm + Next build. Attach domain **vibemarketer.fun** under Domain management (DNS as Netlify instructs).

### 4) Vercel (alternative)

```bash
npx vercel login
npx vercel link
npx vercel env pull   # or paste env in dashboard
# Root / build: pnpm install && pnpm --filter web build
# Output: apps/web (Framework Preset = Next.js)

npx vercel --prod
```

Point the domain to the deployment; keep `NEXT_PUBLIC_SITE_URL` in sync.

### 5) Post-deploy smoke

- Open `https://vibemarketer.fun/demo`  
- Sign in → `/app/compare` → Screen Sam → memo  
- Optional: Table Editor → `signals` / `founder_score_events` after a screen (dual-write)

**Then freeze the backend and record the video.**

---

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm --filter web dev` | Local app |
| `pnpm --filter web build` | Production build |
| `pnpm probe:keys` | Live API key health → `API-KEYS-STATUS.md` |
| `pnpm test` | Engine tests + web smoke |
| `pnpm smoke:e2b` | Live E2B clone/forensics |
| `pnpm seed` | Reseed + score sample founders |

---

## Honest labels (trust with judges)

- Sample founders (Maya / Jordan / Sam) are **synthetic sandbox** data with intentional contradictions where noted.  
- Product Hunt / accelerator / hackathon Identify rows are **curated** when live APIs don’t exist.  
- Composio **publish** stays HITL/stub until a user finishes OAuth; L3 will not fake-publish.  
- OpenAI outage → deterministic memo/math still works; polish skips.  
- Ephemeral filesystem: deck uploads are local/demo; use object storage in long-lived prod.

---

## License & contact

Hackathon submission · operator: see site footer / `NEXT_PUBLIC_CONTACT_EMAIL`.  
Skill libraries remain under their upstream MIT licenses; attribution in planning research under `../hack/plan/research/`.
