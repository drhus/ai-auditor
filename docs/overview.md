---
tags:
  - project
  - ai-governance
  - compliance
status: inbox
repo: https://github.com/drhus/ai-auditor
local_repo: /home/agent/gits/ai-auditor
contacts: []
industry: AI compliance / regtech
started: 2026-05-15
working_name: AiAuditor
inspirations:
  - "https://github.com/vmihalis/hacker-bob"
---

# AiAuditor

**The FDA stamp for AI agents.** An auditing AI agent that fetches a target AI agent's source repo (via GitHub URL or [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) agent ID) and scores it against region-specific AI regulations — starting with the EU AI Act, NIST AI RMF, and ISO/IEC 42001 — producing a per-clause rating with code-anchored evidence and a verifiable on-chain attestation.

> [!info] Hackathon objective
> Help world-class AI builders — especially Chinese teams — expand into Western markets by clearing the regulatory wall faster than anyone else can. AI is global; regulation is local; AiAuditor makes compliance *portable* — instantly verifiable across borders, anchored on chain, recognisable by any buyer in any market.

See [vision](./vision.md) for the long-term arc (continuous attestation, GitHub App, MCP, multi-jurisdiction).

> [!summary]
> - **Stage:** V1 scope locked. V0 build starting today.
> - **Working name:** AiAuditor (rename TBD)
> - **Positioning:** *The audit layer for the ERC-8004 ecosystem.*
> - **Core thesis:** Adapt hacker-bob's multi-stage MCP audit pipeline (RECON → HUNT → VERIFY → GRADE → REPORT) from CVEs to regulatory clauses.
> - **V1 input:** ERC-8004 agent URL (e.g. `https://8004scan.io/agents/{chain}/{tokenId}`) or any direct ERC-8004 agentId. Non-8004 agents are out of scope for V1.
> - **V1 chain:** Sepolia only. No IPFS. Compact on-chain payload: one custom `AuditScored` event + one canonical ERC-8004 `validationResponse`.
> - **V1 regulations:** EU AI Act + NIST AI RMF 1.0 (~20 code-checkable clauses to start). ISO/IEC 42001 deferred to V1.5.
> - **V0 (ships in hours):** landing page + 8004scan URL intake + agent resolution + waitlist. See [v0-mvp-spec](./v0-mvp-spec.md).
> - **Next:** (1) ship V0 to Vercel, (2) Phase 1+2 of [regulations-matrix](./regulations-matrix.md) decomposition on EU AI Act starter slice, (3) deploy minimal `AiAuditorV1` event contract on Sepolia.

## Key Links

- [GitHub Repo](https://github.com/drhus/ai-auditor) (to be created)
- Inspiration — hacker-bob: https://github.com/vmihalis/hacker-bob
- EU AI Act consolidated text: https://artificialintelligenceact.eu/
- NIST AI RMF 1.0 PDF: https://nvlpubs.nist.gov/nistpubs/ai/nist.ai.100-1.pdf
- ERC-8004 spec: https://eips.ethereum.org/EIPS/eip-8004
- ERC-8004 EIPs source: https://github.com/ethereum/EIPs/blob/master/EIPS/eip-8004.md

## Internal docs

- [vision](./vision.md) — the long-term arc: continuous attestation, GitHub App, MCP, multi-jurisdiction
- [prd](./prd.md) — full product requirements (V0 + V1 cuts locked)
- [pipeline-design](./pipeline-design.md) — the RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT pipeline
- [regulations-matrix](./regulations-matrix.md) — clause-level split: code-checkable vs external (jurisdiction / governance / org)
- [user-journey](./user-journey.md) — site flow from 8004scan URL to scored report
- [onchain-anchoring](./onchain-anchoring.md) — Sepolia contract spec, packed event encoding, ERC-8004 ValidationRegistry flow
- [v0-mvp-spec](./v0-mvp-spec.md) — the "ship in hours" cut
- [team-brief](./team-brief.md) — shareable summary for marketing / video / social
- [progress](./progress.md) — append-only journal
- [conversation-log](./conversation-log.md) — chat captures

## Repo Docs (when repo exists)
- [README](https://github.com/drhus/ai-auditor/blob/main/README.md)
- [CLAUDE.md](https://github.com/drhus/ai-auditor/blob/main/CLAUDE.md)
