---
tags:
  - project
  - mvp
  - v0
parent: "[overview](./overview.md)"
ships_in: hours
---

# AiAuditor — V0 MVP Spec

The "ship today, even minimalistically" cut. Production-ready means: deployed, discoverable, looks polished, captures intent, doesn't lie about capabilities.

## What V0 IS

1. **A landing page** that explains AiAuditor, shows the nutritional-facts visual, and pitches the EU AI Act framing.
2. **A real intake form** that accepts `https://8004scan.io/agents/{chain}/{tokenId}` URLs (or raw agentIds).
3. **An agent-resolution API** that:
   - Parses the URL → extracts `chain` + `tokenId`.
   - Calls the canonical ERC-8004 Identity Registry on the matching chain via RPC.
   - Fetches the `agentURI`-resolved registration JSON.
   - Extracts the repo URL from `services[]`, on-chain metadata, or heuristic.
   - Returns agent name, description, image, repo URL, and chain provenance.
4. **An "audit pending" page** that displays the resolved agent metadata and a waitlist email capture ("we'll email you when the full audit is ready").
5. **A public GitHub repo** with the code, CLAUDE.md, and link to [overview](./overview.md).
6. **Deployed on Vercel** at a public URL.

## What V0 IS NOT (deferred)

- ❌ Actual regulation auditing — that's V0.5 → V1.
- ❌ On-chain attestation — deployed contract comes in V1.
- ❌ Repo cloning + RECON scanning — none of the pipeline yet.
- ❌ Directory page — comes when we have audits to list.
- ❌ Agent timeline page — comes when we have audits.
- ❌ Authentication — not needed for V0.

## Stack

| Layer       | Choice                            | Why                                                |
| ----------- | --------------------------------- | -------------------------------------------------- |
| Framework   | **Next.js 16 (App Router)**       | Vercel-native, SSR + API routes in one box         |
| Language    | TypeScript                        | Strict types from day 1                            |
| Styling     | Tailwind v4                       | Speed, well-supported on Vercel                    |
| UI kit      | shadcn/ui (optional)              | Nice components if we want them; not blocking      |
| RPC client  | **viem**                          | Modern, type-safe, multichain                      |
| Deploy      | Vercel                            | One-click, env vars, instant previews              |
| DB (V0)     | None — waitlist to KV / Postgres later | Defer until needed                            |
| Analytics   | Vercel Analytics                  | Free tier, no decisions                            |

## Project structure

```
ai-auditor/
├── README.md                  (marketing-friendly public face)
├── CLAUDE.md                  (links to Obsidian docs — already exists)
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── .env.example
├── .gitignore                 (already exists)
├── src/
│   ├── app/
│   │   ├── layout.tsx         (shared layout, fonts, metadata)
│   │   ├── page.tsx           (landing + intake form)
│   │   ├── globals.css        (Tailwind imports)
│   │   ├── a/
│   │   │   └── [id]/
│   │   │       └── page.tsx   (audit-pending page; V0 = resolved agent display)
│   │   ├── about/
│   │   │   └── page.tsx       (the framing — EU AI Act, why we exist)
│   │   └── api/
│   │       ├── resolve/
│   │       │   └── route.ts   (POST: 8004scan URL → agent metadata + repo URL)
│   │       └── waitlist/
│   │           └── route.ts   (POST: capture email)
│   └── lib/
│       ├── erc8004.ts         (RPC: read Identity Registry across chains)
│       ├── parse-url.ts       (8004scan URL parser)
│       └── chains.ts          (chainId → RPC URL + registry address)
└── regulations/               (placeholder — V1 fills this)
    └── README.md
```

## Page-by-page

### `/` — Landing + intake

**Above the fold:**
- Headline: *The audit layer for AI agents.*
- Sub: *Paste your ERC-8004 agent. Get a verifiable EU AI Act score in minutes.*
- Input field: `https://8004scan.io/agents/...` placeholder.
- Submit button: **Audit my agent** (V0: navigates to `/a/{stub-id}` with the resolved metadata).
- Region selector: EU AI Act (locked-on for V0), NIST AI RMF (badge "soon").

**Mid-page:**
- The nutritional-facts visual (static SVG / styled component) — shows what an audit produces.
- "Why now" — EU AI Act enforcement on 2 Aug 2026, 200k+ 8004 agents already registered.
- 3-step "How it works" — Connect → Audit → Verify on chain.

**Footer:**
- Links: GitHub, docs (later), about, contact.
- ERC-8004 + Sepolia badges.

### `/a/[id]` — Audit pending

V0 doesn't actually run an audit. This page:
- Pulls agent metadata from a session cache (or re-resolves from the agentId in the URL).
- Displays: agent name, description, image, registered chain, repo URL.
- Shows a "Full audit coming soon" banner.
- Email capture: *"We'll email you when the full audit is ready for this agent."*

### `/about` — Framing

Short. The "why we exist" page. EU AI Act stakes, the 8004 ecosystem, our positioning. Cribs heavily from [team-brief](./team-brief.md).

## API

### `POST /api/resolve`

Request:
```json
{ "input": "https://8004scan.io/agents/ethereum/9382" }
```

Logic:
1. Parse: extract `chain` ("ethereum" | "base" | "optimism" | ...) and `tokenId` (number).
2. Lookup chainId + Identity Registry address from `lib/chains.ts`.
3. Call `IdentityRegistry.tokenURI(tokenId)` via viem.
4. Fetch the URI → parse JSON registration file.
5. Extract repo URL from:
   - `services[]` where role ∈ `{"source","repository","code","github"}`.
   - Top-level `repository` / `source` / `github` field.
   - Heuristic regex search for any `github.com/...` URL.
6. Return:
```json
{
  "agentId": "9382",
  "chain": "ethereum",
  "chainId": 1,
  "registryAddress": "0x...",
  "name": "...",
  "description": "...",
  "image": "...",
  "repoUrl": "https://github.com/...",
  "services": [...],
  "fetchedAt": "2026-05-15T..."
}
```

Response codes:
- 200 OK with metadata.
- 404 if the agent isn't registered.
- 422 if URL can't be parsed.
- 502 if the RPC or URI fetch fails.

### `POST /api/waitlist`

Request:
```json
{ "email": "...", "audit_id": "..." }
```

V0: append to a flat file or Vercel KV (whichever is fastest). Email list = future early adopters.

## Environment variables

```
RPC_ETHEREUM=https://...
RPC_BASE=https://...
RPC_OPTIMISM=https://...
RPC_SEPOLIA=https://...
ERC8004_IDENTITY_REGISTRY_ETHEREUM=0x...
ERC8004_IDENTITY_REGISTRY_BASE=0x...
ERC8004_IDENTITY_REGISTRY_OPTIMISM=0x...
ERC8004_IDENTITY_REGISTRY_SEPOLIA=0x...
WAITLIST_STORAGE=vercel-kv | flatfile
```

**TODO before launch:** populate the registry addresses by reading the ERC-8004 deployment docs or scanning the spec's reference impl.

## Deploy

1. `gh repo create drhus/ai-auditor --public --source=. --description="Audit AI agents against AI regulations"` (already scaffolded locally).
2. Push to GitHub.
3. `vercel link` → connect repo to Vercel project.
4. Set env vars in Vercel dashboard.
5. `vercel --prod` (or push to main with auto-deploy).
6. Add custom domain when chosen.

## Success criteria for V0

- [ ] Public URL responding 200 on `/`, `/about`, `/api/resolve` (200/404).
- [ ] Real agent at `https://8004scan.io/agents/ethereum/9382` resolves to a repo URL.
- [ ] Real agent at `https://8004scan.io/agents/base/1380` resolves.
- [ ] One email captured via the waitlist form.
- [ ] Repo is public on GitHub with stars-worthy README.
- [ ] Page loads <2s on mobile, Lighthouse score >85.

## Estimated build time

- **Project scaffold + landing page**: 30–60 min.
- **`/api/resolve` with viem + ERC-8004**: 60–90 min (bulk is figuring out the registry addresses and registration JSON shape per chain).
- **Audit-pending page**: 30 min.
- **Polish + deploy + custom domain**: 30 min.

**Total: 2.5–3.5 hours** to a public URL.

## Open

- Domain choice: `8RR8.com` / `8RR8.com` / `8RR8.com`. Decide before launch.
- Email storage: Vercel KV vs flat file vs Plunk/Resend forward. Vercel KV is fastest path.
- Should `/api/resolve` cache responses? Yes, 5 min TTL — many users will paste the same URL.
- What error states need their own UI page (404 agent, malformed URL, RPC down)? V0 = inline error banners only.
