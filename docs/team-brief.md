---
tags:
  - project
  - team-brief
  - marketing
parent: "[overview](./overview.md)"
audience: team / marketing / video / social
shareable: yes
---

# AiAuditor — Team Brief

For team members working on social, video, design, and other media in parallel with the engineering build. Everything here is OK to draw from for messaging.

---

## In one sentence

**AiAuditor is the audit layer for the ERC-8004 AI-agent ecosystem — point us at a registered agent and we score it against the EU AI Act, on chain, in minutes.**

## In 30 seconds

The EU AI Act is fully enforceable on **2 August 2026**. Forty-five thousand AI agents are already registered on Ethereum's **ERC-8004** standard, with thousands more arriving every week. Right now, none of them have a verifiable record of whether they comply with the regulation that's about to start fining them up to 7% of global revenue.

AiAuditor fixes that. Paste your ERC-8004 agent link, we fetch your source code, run an AI-powered audit pipeline against the EU AI Act (and NIST AI RMF), publish a per-clause score on chain, and produce a public, verifiable "AI nutritional facts" report anyone can check.

## In two minutes — the pitch

**The problem.** AI agents are shipping into production faster than compliance teams can review them. Manual audits cost €25k–€150k and take weeks. There's no fast way for a builder — especially a solo founder — to know:
1. Does my agent fall under the EU AI Act's high-risk classification?
2. What specific code-level controls am I missing (logging, oversight, transparency, content provenance)?
3. How would I score against NIST AI RMF if a customer asked?

**The window.** The EU AI Act's full high-risk regime — conformity assessment, CE marking, EU database registration, Article 50 transparency — kicks in on 2 August 2026. Right now, the entire AI-agent industry is racing toward a deadline with no off-the-shelf way to prove they're ready.

**Our edge.** ERC-8004 went live on Ethereum mainnet on 29 January 2026 — already past **45,000 registered agents**. It's the emerging standard for AI agent identity on chain. We position AiAuditor as the **default audit layer for the 8004 ecosystem**: every registered agent gets a verifiable compliance attestation, posted to the standard ERC-8004 Validation Registry, queryable by any wallet, any dApp, any customer.

**The product.** Paste an `https://8004scan.io/agents/ethereum/9382`-style URL (or any 8004 agent ID), authorise the audit, get a nutritional-facts-style report with per-clause scoring, all anchored on-chain. Hacker-bob-style multi-stage pipeline (RECON → MAP → CHECK → VERIFY → GRADE → REPORT), adapted from security findings to regulatory clauses. Every finding cites file and line.

**The moat over time.** The clauses are public; the *checker library* is what compounds. We build the open-source canonical implementation, become the standard validator on the Validation Registry, and over time anyone running our checker against the same commit gets the same bundle hash — meaning the audit is independently verifiable. Trust scales with verifiability, not with reputation.

## Visual identity — the "AI Nutritional Facts" panel

The single most shareable artefact of the product. Every audit produces one. Print it on tees.

```
┌──────────────────────────────────────────────────┐
│  AI AGENT AUDIT FACTS                            │
│  github.com/foo/bar @ abc1234                    │
│  Audited 2026-05-15 · Audit aud_01J9XYZ          │
├──────────────────────────────────────────────────┤
│  Risk classification     ███████  HIGH-RISK      │
│  Annex III §1(a) biometric (auto-detected)       │
├──────────────────────────────────────────────────┤
│  Overall score                  2.8 / 4.0        │
│                                                  │
│  EU AI Act                      2.6 / 4.0        │
│    Art. 12 Logging              ●●●○  3.0        │
│    Art. 14 Human oversight      ●●○○  2.0        │
│    Art. 15 Robustness           ●●●●  3.5        │
│    Art. 50 Transparency         ●●○○  2.0        │
│                                                  │
│  NIST AI RMF 1.0                3.0 / 4.0        │
│    GOVERN                       ●●○○  2.0        │
│    MEASURE                      ●●●●  3.8        │
│    MANAGE                       ●●●○  3.2        │
├──────────────────────────────────────────────────┤
│  External controls:   5 unconfirmed              │
│  Code-checkable controls covered:  22 / 22       │
├──────────────────────────────────────────────────┤
│  Anchored on Base · EAS UID 0xabc…d3f            │
│  Bundle hash 0x7c9…a12  ·  Report ipfs://bafy…   │
│  Checker v0.3.2  ·  Regulations 2024-08          │
└──────────────────────────────────────────────────┘
```

Designers: this is the seed. Take it and run.

## Tagline candidates

- **The audit layer for AI agents.**
- **AI compliance, on chain.**
- **Audit any AI agent in minutes.**
- **Your agent, audited.**
- **Compliance verification for the autonomous-agent era.**
- **Read the regulation. Read the code. Score the agent.**
- **Trust, but verifiably.**

(My lean: **"The audit layer for AI agents."** Pairs naturally with "on ERC-8004" sub-line.)

## Key stats (use freely in copy)

- **EU AI Act**: Regulation (EU) 2024/1689. Full applicability **2 August 2026**. Penalties up to **€35M or 7% of global turnover** for prohibited-practice violations; up to €15M / 3% for high-risk obligation violations.
- **ERC-8004**: Mainnet live since **29 January 2026**. **45,000+** registered agents as of mid-2026.
- **NIST AI RMF 1.0**: Released January 2023. Four functions (GOVERN, MAP, MEASURE, MANAGE). Voluntary in the US but the de facto reference for enterprise procurement.
- **Manual audit cost**: €25k–€150k. Weeks to months.
- **AiAuditor cost**: minutes per audit; pricing TBD (free tier + paid private tier likely).

## What we can say publicly right now

**Safe to say:**
- "We're building the audit layer for AI agents — point us at an ERC-8004 agent, we audit the code against the EU AI Act."
- "Compliance verification, on chain, in minutes."
- "Built on the hacker-bob pipeline pattern, adapted from security to compliance."
- "Sepolia testnet for V1; mainnet to follow."

**Not yet safe to say:**
- ❌ Specific pricing (TBD).
- ❌ Specific launch date for full V1 (4–6 weeks from build start; gating on regulatory-content review).
- ❌ "Officially endorsed by the EU AI Office" / "Notified Body" — we are **evidence-producing**, not certifying.
- ❌ Claims of legal-grade certainty. Our output is technical evidence to feed into a compliance process, not a replacement for one.

## Status (for honest communication)

- **Today** (Day 0): scoping locked, V0 landing page shipping today.
- **Week 1–2:** regulation decomposition to YAML; first 5 clause checkers built.
- **Week 3–4:** end-to-end pipeline working on golden corpus of 5 public agents.
- **Week 5–6:** Sepolia contracts deployed; first real on-chain attestations.
- **V1 launch:** invite-only beta with 10 partner 8004 agents.
- **Public launch:** when the false-positive rate on golden corpus is <20%.

## Content angles for video / social

1. **"How to audit an AI agent in 5 minutes"** — screen recording of pasting a real 8004 URL and getting a score.
2. **"What does the EU AI Act actually want from your code?"** — explainer on the code-checkable subset of Article 12, 14, 15, 50.
3. **"45,000 AI agents are on chain. How many are compliant?"** — provocative framing piece.
4. **"From security audit to regulation audit"** — credit hacker-bob, explain the pattern adaptation.
5. **"Inside an AI Nutritional Facts label"** — visual breakdown of the panel.
6. **"Why we built this on Sepolia first"** — show the on-chain attestation flow.

## Logo / brand direction (open)

Working name: **AiAuditor**. Open to a punchier name — candidates:
- **AuditScan** / **AgentScan**
- **Veritext**
- **Audited.AI**
- **Compliant.so**

Visual direction: think *clinical*, *clean*, *verifiable*. Nutritional-facts panel is the hero visual. Type: serif for the legal-feel headlines, mono for the on-chain data. Colour: muted with strong status-colours for verdicts (green pass / amber partial / red fail).

## Repo / public links

- Code (open source): https://github.com/drhus/ai-auditor
- Site: TBD (target: `aiauditor.app` or `aiauditor.drhus.com`)
- ERC-8004 reference: https://eips.ethereum.org/EIPS/eip-8004
- EU AI Act reference: https://artificialintelligenceact.eu/
- Hacker-bob (inspiration): https://github.com/vmihalis/hacker-bob

## Who's working on what

- **Hus + Claude:** engineering — V0 landing → full V1 pipeline → Sepolia contracts.
- **Marketing / social / video:** team in parallel. Take everything in this doc as fair game.
- **Compliance review:** TBD — looking for a reviewer to sanity-check the clause decomposition before V1 launch.

Questions to me anytime.
