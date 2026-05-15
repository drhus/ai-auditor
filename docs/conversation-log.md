---
tags:
  - project
  - conversations
parent: "[overview](./overview.md)"
---

# AiAuditor — Conversations

Append new entries at the top in reverse chronological order.

---

## 2026-05-15 (later) — V1 scope locked, V0 scaffolded and pushed

**Channel:** Claude Code, continuing onboarding session.

**Decisions locked through brainstorm:**

1. **Auditing identity:** three-layer — commit SHA + tree SHA + audit bundle hash. Bundle hash is what we publish on chain.
2. **Audit ID:** ULID (`aud_01J9XYZ…`) for human-readable, bundle hash for on-chain anchoring.
3. **On-chain target:** Sepolia in V1. Custom `AuditScored` event (packed clause scores in 4-byte triplets) plus canonical ERC-8004 `validationResponse`. No IPFS — rich content cached server-side, on-chain payload is sufficient to reconstruct the nutritional-facts panel in the browser.
4. **Privacy tiers:** default public + paid private + publish-later option. 24h grace window before broadcast for panic-revoke.
5. **V1 scope cut:** audit only ERC-8004-registered agents. No auto-registration, no claim mechanism, no EAS. Non-registered agents see "register first" CTA.
6. **Regulations versioning:** local YAML in repo for V1, IPFS later. `regulationsVersion` = git SHA of pack.

**Methodology agreed for regulation decomposition:**
- Phase 1: Source aggregation (canonical PDFs into `regulations/sources/`).
- Phase 2: Atomic decomposition (LLM-assisted, human-reviewed) into clause YAML.
- Phase 3: Code/Mixed/External classification (already in [regulations-matrix](./regulations-matrix.md) at Article level; needs finer granularity).
- Phase 4: Build first 5 checkers (Art 6+Annex III, Art 12, 14, 50, NIST MEASURE 2.3).
- Phase 5: Golden corpus of 5–8 real agent repos.
- Phase 6: Iterate.

**Concrete deliverables this turn:**
- [onchain-anchoring](./onchain-anchoring.md) written.
- [team-brief](./team-brief.md) written.
- [v0-mvp-spec](./v0-mvp-spec.md) written.
- Next.js V0 scaffolded in `~/gits/ai-auditor`.
- Public GitHub repo created at https://github.com/drhus/ai-auditor.
- PRD revised, overview revised, progress updated.

**Next steps for the user:**
- Populate `.env.local` registry addresses + RPC URLs.
- `npm install` and dev-test against real 8004scan URLs.
- Choose a domain and Vercel deploy.
- Share [team-brief](./team-brief.md) with marketing/video team.

---

## 2026-05-15 — Initial brain dump (user → Claude)

**Channel:** Claude Code, `/onboard-project`.

**User said (verbatim, summarised):**
- Building a system + AI agent that audits and scores AI agents against regulation. Working name **AiAuditor**.
- Client exposes their GitHub repo. AiAuditor fetches and scans it, checks against region-specific regulation (e.g. EU AI Act), rates per area of the regulation.
- Two parts:
  1. Aggregate major clear AI/software regulations worldwide; quantify per area; start with 2–3 most popular. Decide which clauses relate to **code/execution environment** vs **external** (company location, legal entity). Test against the code-related ones.
  2. User journey: site → input ERC-8004 agentId (fetch from ERC-8004 + codebase) **or** input repo URL (if private, GitHub OAuth on the fly) → pipeline similar to https://github.com/vmihalis/hacker-bob/ → audit.
- Request: study hacker-bob's pipeline, design a similar pipeline for regulation audit.

**Claude actions:**
- Created `10-projects/ai-auditor/` with overview, PRD, progress, conversation log, [pipeline-design](./pipeline-design.md), [regulations-matrix](./regulations-matrix.md), [user-journey](./user-journey.md).
- Studied hacker-bob (Node MCP, seven-stage pipeline, optional external tools).
- Researched EU AI Act 2026 enforcement timeline, NIST AI RMF 1.0 structure, ERC-8004 registry interfaces.
- Created `~/gits/ai-auditor/` with CLAUDE.md → Obsidian bridge.

---
