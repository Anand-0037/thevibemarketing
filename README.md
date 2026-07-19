# vibemarketer

**Official site:** [https://vibemarketer.fun](https://vibemarketer.fun)  
**Code:** [github.com/Anand-0037/thevibemarketing](https://github.com/Anand-0037/thevibemarketing)

Cursor for marketing — autonomous AI agents for SaaS distribution.  
**VC Brain** is the sourcing feature: Identify → Diligence → $100K evidence memo.

---

## Product

| Surface | What it does |
|---------|----------------|
| Marketing fleet | Brand memory → Studio drafts → HITL queue → publish only after provider confirm |
| VC Brain | Live Identify, distribution gravity, 3-axis screen, Trust/Diligence, memos |

We never invent people or companies. Identify pulls **live** GitHub / HN / arXiv only. Unavailable sources return zero rows (`not configured`). Discovered authors are **candidates**, not verified founders.

---

## Build vs borrow

| Borrow | Build |
|--------|--------|
| Composio, Firecrawl, E2B, OpenAI, Supabase, Supermemory | Gravity scorer, 3-axis screen, Diligence/Trust, Founder Score, HITL, workspace isolation |
| MIT marketing skill playbooks | Agent lanes, traces, product UX |

---

## Stack

```
apps/web          Next.js (UI + API)
packages/engine   @vibe/engine
supabase/         Auth + Memory migrations (RLS)
```

Flow: **authenticated user → owned workspace → live ingest → score → Diligence → memo → Supabase**

---

## Local

```bash
pnpm install
cp .env.example .env
# set keys; AUTH_BYPASS=0; USE_POSTGRES_DUAL=1
pnpm test:engine
pnpm --filter web dev
```

Production site URL (deploy):

```text
NEXT_PUBLIC_SITE_URL=https://vibemarketer.fun
```

Local only:

```text
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never commit `.env`. Apply `supabase/migrations/` in the Dashboard before dual-write.

---

## Deploy → vibemarketer.fun

Ops runbook (lives outside this repo root):  
[`../hack/project files/DEPLOY.md`](../hack/project%20files/DEPLOY.md)

1. Push **this directory** as the GitHub repo root  
2. Netlify (or Vercel) · base = repo root · use `netlify.toml`  
3. Env: all keys + `NEXT_PUBLIC_SITE_URL=https://vibemarketer.fun` + `AUTH_BYPASS=0`  
4. Supabase Auth: Site URL + redirect `https://vibemarketer.fun/auth/callback`  
5. Attach custom domain **vibemarketer.fun**  
6. Smoke: empty signup → Identify → only live candidates → restart persists your workspace  

---

## Ship checklist

| Gate | Status |
|------|--------|
| No synthetic founders / curated fake PH-accel-hack people | Done |
| No marketing seed posts in production path | Done |
| Private `/api/*` requires session | Done |
| Per-user workspace `owner_id` | Done |
| Approve → `queued` (not fake `published`) | Done |
| Domain identity `vibemarketer.fun` in code | Done |
| SQL migrations applied in Supabase | **You confirm** |
| Full app pushed to GitHub | **You confirm** |
| Staging smoke + DNS for vibemarketer.fun | **You do** |

### Known limits (OK to ship with eyes open)

- Decks still on ephemeral disk (Storage cutover next)  
- Marketing brand/posts not fully multi-tenant Postgres yet  
- Memos/traces dual-write incomplete (schema exists)  

---

## License

Proprietary for now · operator contact via site footer / `NEXT_PUBLIC_CONTACT_EMAIL`.
