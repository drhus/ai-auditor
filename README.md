# AiAuditor

**The Verified Fact Stamp about your agent — compliance and regulation conformity, anchored on chain.**

Paste an ERC-8004 agent URL or a GitHub repo. We resolve the source code, audit it against the EU AI Act and NIST AI RMF, and publish a verifiable score on chain. AI is global; regulation is local; AiAuditor makes compliance *portable* and the audit trail *verifiable*.

```
https://8004scan.io/agents/ethereum/9382  →  per-clause audit  →  on-chain attestation
```

> Status: **V0 (Day 0)** — landing page + agent resolution shipping today. Full pipeline in active build.

## Why this exists

The EU AI Act becomes fully applicable on **2 August 2026**. Penalties reach **€35M or 7% of global turnover**. ERC-8004 is already past **200,000 registered AI agents** as of 2026. None of them have a standard verifiable compliance record. AiAuditor is that record.

## How it works

Multi-stage pipeline that adapts established security-audit patterns to regulatory clauses:

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

The end-state is **continuous attestation** — every commit triggers a new audit, every score is live on chain, every agent's compliance trail evolves with the code. Full detail in [docs/vision.md](./docs/vision.md).

- **V0 (today):** landing + agent resolution.
- **V0.5 (2 weeks):** repo cloning + first 5 EU AI Act clause checkers (Art 12, 14, 15, 50; high-risk classification).
- **V1 (4–6 weeks):** Sepolia contract deployed, full pipeline live, public directory of audits, 20+ clauses across EU AI Act + NIST AI RMF.
- **V2 (+8–12 weeks):** GitHub App + CI/CD — re-audit on every commit, score evolves with the code.
- **V3 (+3–4 months):** MCP server — Claude Code / Codex / autonomous agents audit themselves before deploy.
- **V4 (+4–6 months):** Multi-jurisdiction — one audit, per-market scores for EU + US + UK + Japan + Singapore + more.
- **V5 (+6–12 months):** Decentralised audit market on ERC-8004's Validation Registry.

## Docs

Full project documentation lives in [`docs/`](./docs):

- [Overview](./docs/overview.md) · [PRD](./docs/prd.md) · [Team brief](./docs/team-brief.md)
- [Pipeline design](./docs/pipeline-design.md) · [On-chain anchoring](./docs/onchain-anchoring.md) · [User journey](./docs/user-journey.md)
- [Regulations matrix](./docs/regulations-matrix.md) · [V0 MVP spec](./docs/v0-mvp-spec.md)

## License

MIT.
