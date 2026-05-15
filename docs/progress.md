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
- Researched ERC-8004 (mainnet 2026-01-29, 200k+ agents, Identity + Reputation + Validation registries).
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

### 2026-05-15 (Day 0 — evening)

- **End-to-end resolution working with real on-chain data.** Verified against `ethereum/9382` (Captain Dackie), `ethereum/13445` (Gekko, fully on-chain base64 metadata), `base/1380` (Captain Dackie cross-chain). Booted dev server in 344 ms; viem reads from getblock.io RPCs work cleanly.
- **ERC-8004 Identity Registry addresses pinned:** Ethereum/Base/Optimism mainnet `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`; Sepolia `0x8004A818BFB912233c491871b3d84c89A494BD9e`. Source: github.com/erc-8004/erc-8004-contracts.
- **Real-data observation:** most 8004 agents don't have a `source`/`repository` service in their registration. They expose `web`, `MCP`, `A2A`, `OASF` services pointing to their *runtime*, not their source. Means we **must** support manual repo input.
- **Scope re-opened (per direction):**
  - Bumped ecosystem stat: 200k+ agents (was 45k+).
  - Re-added auto-registration for non-registered repos so every audit can post to the Validation Registry. Claim flow defined for V1.5.
  - Domain locked: **[8RR8.com](https://8RR8.com)**.
- **Updated everywhere:** `overview.md`, `prd.md`, `vision.md`, `team-brief.md`, `onchain-anchoring.md` reflect new stats, new domain, re-opened auto-registration.

