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
---

# AiAuditor

**The FDA stamp for AI agents.** An auditing AI agent that fetches a target AI agent's source repo (via GitHub URL or [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) agent ID) and scores it against region-specific AI regulations — starting with the EU AI Act, NIST AI RMF, and ISO/IEC 42001 — producing a per-clause rating with code-anchored evidence and a verifiable on-chain attestation.

> [!info] Hackathon objective
> Help world-class AI builders — especially Chinese teams — expand into Western markets by clearing the regulatory wall faster than anyone else can. AI is global; regulation is local; AiAuditor makes compliance *portable* — instantly verifiable across borders, anchored on chain, recognisable by any buyer in any market.

See [vision](./vision.md) for the long-term arc (continuous attestation, GitHub App, MCP, multi-jurisdiction).

> [!summary]
> - **Stage:** V1 scope locked. V0 shipped locally; deploy to 8RR8.com next.
> - **Working name:** AiAuditor · **Domain:** [8RR8.com](https://8RR8.com)
> - **Positioning:** *The FDA stamp for AI agents — anchored on chain, recognised across markets.*
> - **Core thesis:** Multi-stage audit pipeline (RECON → MAP → CHECK → VERIFY → GRADE → REPORT) adapting established security-audit patterns from CVEs to regulatory clauses.
> - **V1 input:** Two paths — (a) ERC-8004 agent URL like `https://8004scan.io/agents/{chain}/{tokenId}` for the 200k+ already-registered agents, **or** (b) direct GitHub repo URL for unregistered software. We auto-register unregistered repos on 8004 so every audit lands in the canonical Validation Registry.
> - **V1 chain:** Sepolia for V0/V1; Base for mainnet rollout.
> - **V1 anchoring:** One custom `AuditScored` event + one canonical ERC-8004 `validationResponse`. No IPFS in V1 — packed event payload + server-side rich content.
> - **V1 regulations:** EU AI Act + NIST AI RMF 1.0 (~20 code-checkable clauses to start). ISO/IEC 42001 deferred to V1.5.
> - **V0 (today):** landing page + dual intake (8004 URL or GitHub URL) + agent/repo resolution + waitlist. See [v0-mvp-spec](./v0-mvp-spec.md).
> - **Next:** (1) ship V0 to 8RR8.com via Vercel, (2) Phase 1+2 of [regulations-matrix](./regulations-matrix.md) decomposition on EU AI Act starter slice, (3) deploy minimal `AiAuditorV1` event contract on Sepolia.

## Key Links

- [GitHub Repo](https://github.com/drhus/ai-auditor) (to be created)
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
