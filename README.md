# AiAuditor

**The audit layer for AI agents.** Paste an ERC-8004 agent URL — we resolve the registered repository, audit the code against the EU AI Act and NIST AI RMF, and publish a verifiable score on chain.

```
https://8004scan.io/agents/ethereum/9382  →  per-clause audit  →  on-chain attestation
```

> Status: **V0 (Day 0)** — landing page + agent resolution shipping today. Full pipeline in active build.

## Why this exists

The EU AI Act becomes fully applicable on **2 August 2026**. Penalties reach **€35M or 7% of global turnover**. ERC-8004 is already past **45,000 registered AI agents** as of 2026. None of them have a standard verifiable compliance record. AiAuditor is that record.

## How it works

Multi-stage pipeline inspired by [hacker-bob](https://github.com/vmihalis/hacker-bob), adapted from security findings to regulatory clauses:

```
INTAKE → FETCH → RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT → ANCHOR
```

Each in-scope clause is checked by a deterministic rule and (where needed) an LLM judge. Every finding cites file and line. The final score is anchored on Sepolia as a packed `AuditScored` event plus a canonical ERC-8004 `validationResponse`.

## V0 today (this repo)

- Next.js 16 (App Router) + viem.
- Landing page with intake form.
- `/api/resolve` — POST an 8004scan.io URL, get the resolved agent metadata + repository URL.
- `/a/{chain}/{tokenId}` — agent detail page with waitlist for the full audit.
- Vercel-deployable as-is.

## Develop locally

```bash
git clone https://github.com/drhus/ai-auditor.git
cd ai-auditor
npm install
cp .env.example .env.local
# fill in registry addresses + RPC URLs
npm run dev
```

Then visit http://localhost:3000.

## Deploy

```bash
vercel link
vercel env pull
vercel --prod
```

## Roadmap

- **V0 (today):** landing + agent resolution.
- **V0.5 (2 weeks):** repo cloning + first 5 EU AI Act clause checkers (Art 12, 14, 15, 50; high-risk classification).
- **V1 (4–6 weeks):** Sepolia contract deployed, full pipeline live, public directory of audits, 20+ clauses across EU AI Act + NIST AI RMF.

## Docs

The product docs live alongside the code in the [project vault](https://github.com/drhus/second-brain) under `10-projects/ai-auditor/` — PRD, pipeline design, regulations matrix, on-chain anchoring spec, team brief.

## License

MIT.
