---
tags:
  - project
  - progress
parent: "[overview](./overview.md)"
---

# AiAuditor — Progress

## Log

### 2026-05-15 (Day 0)
- Project onboarded into Second Brain — folder `10-projects/ai-auditor/`.
- Brain dump captured into [prd](./prd.md) and [overview](./overview.md).
- Studied [hacker-bob](https://github.com/vmihalis/hacker-bob) pipeline: confirmed seven-stage MCP-driven flow.
- Designed adapted pipeline for regulation audits: [pipeline-design](./pipeline-design.md). RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT.
- Drafted [regulations-matrix](./regulations-matrix.md) separating code-checkable vs external clauses for EU AI Act, NIST AI RMF, ISO/IEC 42001.
- Researched ERC-8004 (mainnet 2026-01-29, 45k+ agents, Identity + Reputation + Validation registries).
- **V1 scope locked:** Sepolia only, ERC-8004-registered agents only, no IPFS, no auto-registration, no claim mechanism. Compact on-chain payload: one custom `AuditScored` event + one canonical `ValidationResponse`. See [onchain-anchoring](./onchain-anchoring.md).
- **V0 spec written:** [v0-mvp-spec](./v0-mvp-spec.md) — landing page + 8004scan URL intake + agent resolution + waitlist. Shippable in 2.5–3.5 hours.
- **V0 scaffolded and pushed:** Next.js 16 + viem, deployed-ready, repo public at https://github.com/drhus/ai-auditor.
  - Landing page with intake form + AI Nutritional Facts visual
  - `/api/resolve` parses 8004scan URLs, reads `tokenURI` from Identity Registry across ethereum/base/optimism/sepolia, extracts repo URL from registration JSON
  - `/a/[chain]/[id]` agent detail page with waitlist
  - `/about` framing page
- **Team brief written:** [team-brief](./team-brief.md) — shareable summary for marketing/video work in parallel.
- **Pending for V0 to function end-to-end:**
  1. Populate `ERC8004_IDENTITY_REGISTRY_*` env vars with canonical deployment addresses.
  2. `npm install` + Vercel deploy.
  3. Choose domain.
- **Pending decisions:**
  - Stack for the actual checker engine: Python+LangGraph (lean) vs Node MCP. V0 is Next.js regardless.
  - Compliance reviewer for the atomic clause decomposition pass.
  - Domain: `aiauditor.app` / `aiauditor.eu` / `aiauditor.drhus.com`.

