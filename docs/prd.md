---
tags:
  - project
  - prd
parent: "[overview](./overview.md)"
status: v1-locked
---

# AiAuditor — PRD

## Problem

AI agents are shipping faster than compliance can review them. The EU AI Act becomes fully applicable on **2 August 2026** — high-risk conformity assessment, CE marking, EU database registration, Article 50 transparency obligations all in force. Builders need a fast way to know:

1. Whether their agent falls under high-risk classification.
2. Which specific code-level controls are missing (logging, oversight hooks, transparency, robustness, content provenance).
3. How they'd score against NIST AI RMF if a customer asked.

Manual audits cost €25k–€150k and take weeks. Existing tooling covers slices but doesn't read the actual repo.

In parallel: **45k+ AI agents are registered on ERC-8004** as of early 2026. Every one of them needs a verifiable compliance record. There is no standard for that record yet.

## Goal

Ship an **auditing AI agent** positioned as **the audit layer for the ERC-8004 ecosystem**, that:

- Accepts an ERC-8004 agent URL (`https://8004scan.io/agents/{chain}/{tokenId}`) or a raw agentId.
- Resolves agent metadata + repo URL from the Identity Registry.
- Runs a multi-stage pipeline (modelled on [hacker-bob's pipeline](https://github.com/vmihalis/hacker-bob)) targeting regulatory clauses.
- Posts findings on-chain: one compact `AuditScored` event + one canonical ERC-8004 `validationResponse`.
- Surfaces the audit on a public directory and a per-audit detail page (nutritional-facts style).

## Non-goals (V1)

- Auditing agents not registered on ERC-8004 (deferred to V1.5).
- Auto-registration of agents we audit (deferred — claim mechanism complexity).
- IPFS / Arweave / off-chain decentralised storage (deferred to mainnet).
- EAS attestations (deferred — see [onchain-anchoring § future-mainnet-and-non-8004-path](./onchain-anchoring.md#future-mainnet-and-non-8004-path)).
- Mainnet deployment (V1 is Sepolia-only).
- Live runtime / behavioural testing of agents (no prompts to the deployed agent).
- Legal advice or formal certification (we produce evidence, not a Notified Body conformity assessment).

## Scope — V0 (ships in hours)

See full spec: [v0-mvp-spec](./v0-mvp-spec.md).

- Landing page with intake (8004scan URL or agentId).
- API endpoint that resolves the URL → fetches Identity Registry entry → returns agent metadata + repo URL.
- "Audit pending" page with waitlist email capture.
- Deployed on Vercel under `aiauditor.{domain}`.
- Open-source on `github.com/drhus/ai-auditor`.

## Scope — V1 (next 4–6 weeks)

**Input gate:**
- Only ERC-8004-registered agents are auditable. Non-registered URLs surface a "Register first" CTA.

**Pipeline:** See [pipeline-design](./pipeline-design.md). Locked at:
```
INTAKE → FETCH → RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT → ANCHOR
```

**Regulations covered:**
- EU AI Act — ~20 code-checkable clauses (Art. 6 Annex III, Art. 9, 10, 12, 13, 14, 15, 50)
- NIST AI RMF 1.0 — ~10 subcategories (MEASURE 2.3/2.7/2.8/2.11; MANAGE 2.3/4.1; MAP 1.1/3.4; GOVERN 1.4/1.5)
- ISO/IEC 42001 — deferred to V1.5

**On-chain anchoring (Sepolia):**
- Deploy custom `AiAuditorV1` contract emitting one `AuditScored` event per audit (compact, packed payload — see [onchain-anchoring](./onchain-anchoring.md)).
- Also call canonical ERC-8004 `ValidationRegistry.validationResponse()` so audits show up in the standard 8004 discovery surface.
- 24-hour grace window between audit completion and broadcast (panic-revoke / private-tier upgrade path).

**Privacy tiers:**
| Tier            | Audit run | Report shown to user | On-chain emission       | Price (V1) |
| --------------- | --------- | -------------------- | ----------------------- | ---------- |
| Public (default)| Yes       | Yes                  | Yes, after 24h grace    | Free       |
| Private         | Yes       | Yes                  | No                      | Paid       |
| Publish later   | (re-run)  | Yes                  | Yes, on user trigger    | Free       |

**UX surfaces:**
- `/` — landing + intake.
- `/audits` — public directory: search by audit ID, bundle hash, commit SHA, agent name, repo URL.
- `/a/{auditId}` — per-audit page, nutritional-facts summary, on-chain verification links, full report.
- `/agent/{agentId}` — timeline of audits for one 8004 agent.

**Backend:**
- Thin indexer over Sepolia: subscribes to our `AuditScored` events + the Validation Registry, populates Postgres for fast search.
- Holds the "rich content" (evidence file:line snippets, rationale, remediation hints) the chain doesn't.

## User Stories

- [ ] As an **8004-registered agent builder**, I paste my 8004scan URL and within ~5 minutes get a per-clause EU AI Act report so I know what to fix before launch.
- [ ] As an **agent builder**, I see my audit get a verifiable on-chain attestation that customers can independently confirm.
- [ ] As a **prospect evaluating an agent**, I can search the public directory by agent name or repo URL and see who's been audited and how they scored.
- [ ] As an **auditing user**, I can see which clauses are code-checkable vs external (jurisdiction, governance, contracts) so I know what still needs a human review.
- [ ] As an **agent builder**, I can re-run after pushing fixes and see the score move (new attestation, references prior).
- [ ] As a **private-tier customer**, I can run an audit, see the report, and choose later whether to publish.

## Success Criteria

**V0 (today):**
- [ ] V0 deployed on Vercel at a public URL.
- [ ] 8004scan.io URL intake successfully resolves at least 3 different real registered agents (across Ethereum + Base + Optimism).
- [ ] Waitlist captures emails for full-audit access.
- [ ] Repo public on GitHub with README, CLAUDE.md, and links back to docs.

**V1 (4–6 weeks):**
- [ ] End-to-end audit run on 5 public 8004-registered agent repos completes in <10 min each.
- [ ] At least 20 clauses across EU AI Act + NIST AI RMF have working code-checkers.
- [ ] Every finding cites file:line. Zero "trust me" findings.
- [ ] False-positive rate on golden corpus <20% for "fail" verdicts.
- [ ] Code/external split in [regulations-matrix](./regulations-matrix.md) reviewed by a compliance-savvy reader.
- [ ] On-chain attestations visible on Sepolia for at least 10 real agents, all retrievable via standard 8004 discovery.

## Open Questions (still unresolved)

- **Stack** for the checker engine: Python+LangGraph (lean) vs Node MCP (mirrors hacker-bob). V0 is Next.js regardless; the checker can be a separate service.
- **Compliance reviewer** to sanity-check the atomic clause decomposition before V1 ships.
- **24h grace window** UX detail: do we hide the score from the user during grace, or show it as "publishing in 22h"?
- **Sepolia ERC-8004 deployment addresses** for Identity + Validation Registry — to confirm before contract calls.
- **Domain** for V0 deploy: `aiauditor.drhus.com`? `aiauditor.app`? `aiauditor.eu`? (rests with marketing/team).
