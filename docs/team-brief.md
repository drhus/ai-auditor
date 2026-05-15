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

## The hackathon objective

**Help world-class AI builders — especially Chinese teams — expand into Western markets by clearing the regulatory wall faster than anyone else can.**

AI is global. Regulation is local. A team in Shenzhen or Hangzhou shipping a brilliant agent into Europe or the US runs head-on into the EU AI Act, NIST AI RMF, and a dozen frameworks the agent was never designed against. Manual compliance costs €25k–€150k and takes months — long enough to kill the market window. AiAuditor turns that into **60 seconds of on-chain attestation** any buyer, anywhere, can verify.

Public-good framing: every piece of AI software on the planet, with a live, on-chain "nutrition label" telling buyers what's inside and whether it's safe to use.

## In one sentence

**The FDA stamp for AI agents — earned in minutes, anchored on chain, recognised across markets.**
OR 
"Think Michelin stars, but for AI compliance." OR "A nutrition label for AI — at a glance, you know what's inside and whether it's safe."

## In 30 seconds

World-class AI agents are being built faster than regulators can review them — and the teams building the best ones often sell into markets whose rules they weren't designed against. A Chinese AI startup shipping into the EU collides with the EU AI Act. A European agent shipping into the US bumps into NIST. Manual audits cost €25k–€150k and take months.

AiAuditor closes the gap: paste your ERC-8004 agent or GitHub repo, get an instant audit, publish a verifiable compliance attestation on chain that any buyer in any market can independently check in 30 seconds. The audit re-runs on every commit. The score evolves with the code. The trust is portable, public, and permanent.

## In two minutes — the pitch

**The problem.** AI is global; regulation is local. Excellent AI agents are being built in China, the EU, the US, the UK, and many other markets — but compliance isn't transferable. A team that built a stellar agent in one jurisdiction has to spend months (and tens of thousands of euros) proving it complies with the rules of every other jurisdiction they want to sell into. That gap is killing cross-border AI commerce.

**The window.** The EU AI Act's full high-risk regime — conformity assessment, CE marking, Article 50 transparency — kicks in on **2 August 2026**. Penalties reach **€35M or 7% of global turnover**. The entire global AI-agent industry is racing toward a deadline with no off-the-shelf way to prove they're ready, and Western buyers are getting increasingly nervous about procurement from teams without a recognisable compliance trail.

**Our edge — ERC-8004.** Mainnet since 29 January 2026, already past **200,000 registered AI agents**. It's the emerging standard for agent identity on chain. We position AiAuditor as the **default audit layer for the 8004 ecosystem**: every registered agent gets a verifiable compliance attestation, posted to the standard Validation Registry, queryable by any wallet, any dApp, any customer.

**The product.** Paste an `https://8004scan.io/agents/ethereum/9382`-style URL (or a GitHub repo), authorise the audit, get a nutritional-facts-style report with per-clause scoring, all anchored on chain. Hacker-bob-style multi-stage pipeline (RECON → MAP → CHECK → VERIFY → GRADE → REPORT), adapted from security findings to regulatory clauses. Every finding cites file and line.

**The full vision.** Manual paste → continuous attestation. V2 ships a **GitHub App + CI/CD hook**: every commit re-audits, every score updates, every push is a new on-chain attestation. V3 ships an **MCP server** so AI agents (Claude Code, Codex, the next thing) can audit themselves before they deploy. V4 spans multiple jurisdictions in one run — pick your destination markets, get a score for each. The end-state: **every piece of AI software in the world carries a live, on-chain compliance score that updates with the code.**

**The moat.** The clauses are public; the checker library is what compounds. We build the open-source canonical implementation, become the standard validator on the Validation Registry, and over time anyone running our checker against the same commit gets the same bundle hash — meaning the audit is independently verifiable. Trust scales with verifiability, not reputation.

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

## Taglines — the three angles

Three positioning angles, each strong on its own. Use whichever fits the channel: serious (regulators, buyers), aspirational (builders, ecosystem), public-good (press, BGA, civic).

### 1. Authority — *the FDA angle*

> **The FDA stamp for AI agents — earned in minutes, not years.**

Variants:
- *An FDA-style approval for AI. Minutes to issue. On chain to verify. Free to check.*
- *Like the FDA, for AI. Except it doesn't take ten years.*

Names the pain (speed) and the prize (legitimacy). Best for **buyers and regulators** — anyone whose default mental model is "is this thing approved?"

### 2. Aspiration — *the Michelin angle*

> **Michelin stars for AI agents — every score public, every audit on chain.**

Variants:
- *A Michelin guide for AI compliance — public scores, public chases.*
- *Stars for the agents that earn them. On chain, forever.*

Memorable, visual, implies a public ranking the whole ecosystem chases. Best for **builders and ecosystem** — anyone who wants their work seen, scored, and celebrated.

### 3. Public good — *the nutrition-label angle*

> **A nutrition label for AI — what's inside, what's safe, at a glance.**

Variants:
- *The nutrition label for AI. Read it in 5 seconds. Verify it on chain in 30.*
- *Every AI agent deserves a label. Every buyer deserves to read it.*

Best for **press, BGA, civic audiences** — anyone whose framing is "the public has a right to know."

**Top-level lean:** lead with **"The FDA stamp for AI agents"** for headlines, layer in *Michelin* and *nutrition label* in deeper copy. The Nutritional Facts visual operationalises all three at once.

## Key stats (use freely in copy)

- **EU AI Act**: Regulation (EU) 2024/1689. Full applicability **2 August 2026**. Penalties up to **€35M or 7% of global turnover** for prohibited-practice violations; up to €15M / 3% for high-risk obligation violations.
- **ERC-8004**: Mainnet live since **29 January 2026**. **200,000+** registered agents as of mid-2026.
- **NIST AI RMF 1.0**: Released January 2023. Four functions (GOVERN, MAP, MEASURE, MANAGE). Voluntary in the US but the de facto reference for enterprise procurement.
- **Manual audit cost**: €25k–€150k. Weeks to months.
- **AiAuditor cost**: minutes per audit; pricing TBD (free tier + paid private tier likely).


## The long-term arc (a.k.a. the demo storyboard)

The end state is *continuous attestation*: every AI agent on the planet carries a live, on-chain compliance score that updates with the code.

| Version | What ships | What the user does | What lands on chain |
| ------- | ---------- | ------------------ | ------------------- |
| **V0 (today)** | Landing + intake + agent resolution + waitlist | Pastes ERC-8004 agent URL | Nothing yet — proves the front door |
| **V1 (6 weeks)** | Full pipeline, 20+ clause checkers, dashboard, directory | Pastes URL, runs audit | Packed `AuditScored` event + ERC-8004 `validationResponse` |
| **V2** | GitHub App + CI/CD hook | Installs app on repo, pushes commits | New attestation per relevant commit; score evolves |
| **V3** | MCP server | Claude Code / Codex / autonomous agents call us before deploy | Pre-deploy attestation; agents self-audit |
| **V3.5** | **TEE build attestation** | Builds binary in a TEE (Nitro / TDX / SEV-SNP) | `buildAttestation { commitSha, enclaveMeasurement, binaryHash }` |
| **V4** | Multi-jurisdiction support | Picks destination markets (EU + US + UK + Japan + Singapore + …) | One audit, per-market scores |
| **V4.5** | **TEE runtime attestation** | Deploys to a TEE host (Phala / Marlin / Automata) | `runtimeAttestation { binaryHash, runtimeEnclaveMeasurement }` |
| **V5** | Trust graph | Auditors stake on each other's verdicts; protocol selects best validators | Decentralised audit market with AiAuditor as the founding canonical validator |
| **V5.5** | **Per-session verification** | Buyer's browser challenges the live enclave before sending a prompt | `sessionProof { sessionId, runtimeAttestation, transcript }` |

End-state pitch: *"Like SSL certificates for AI compliance. Every agent has one. It's free to check. It updates with the code. Buyers worldwide can verify in 30 seconds before they integrate."*

**The provenance pitch (V3.5+):** *"The audit is true. The build matches the audit. The runtime matches the build. The agent you're talking to right now matches the runtime. Every link verifiable on chain."* This is what answers the hardest Western enterprise objection: *"how do I know the deployed system is what was audited?"*

## Status (for honest communication)

- **Today** (Day 0): scoping locked, V0 landing page shipping today.
- **Week 1–2:** regulation decomposition to YAML; first 5 clause checkers built.
- **Week 3–4:** end-to-end pipeline working on golden corpus of 5 public agents.
- **Week 5–6:** Sepolia contracts deployed; first real on-chain attestations.
- **V1 launch:** invite-only beta with 10 partner 8004 agents.
- **Public launch:** when the false-positive rate on golden corpus is <20%.
- **V2 (post-hackathon, 8–12 weeks):** GitHub App + continuous re-audit on push.
- **V3 (3–4 months):** MCP server. Agents audit themselves.

## Content angles for video / social

1. **"How to sell your Chinese AI agent into Europe — in 60 seconds"** — screen recording of a real 8004 URL → instant audit → on-chain attestation that an EU buyer can verify. *The hero hackathon video.*
2. **"The FDA stamp for AI — except it takes 60 seconds, not 10 years"** — explainer of the analogy, tied to a live demo.
3. **"Inside an AI Nutritional Facts label"** — visual breakdown of the panel, what each line means, why it matters.
4. **"What does the EU AI Act actually want from your code?"** — explainer on the code-checkable subset of Article 12, 14, 15, 50.
5. **"200,000 AI agents are on chain. How many are compliant?"** — provocative framing piece.
6. **"From security audit to regulation audit"** — credit hacker-bob, explain the pattern adaptation.
7. **"Continuous compliance — every commit, a new attestation"** — the long-term vision: GitHub push → re-audit → updated on-chain score.
8. **"Why we built this on ERC-8004"** — positioning AiAuditor as the default validator for the 8004 ecosystem.
9. **"How do you know the deployed AI is the audited AI?"** — TEE-attested build + runtime chain. The provenance angle. Differentiates us from every other audit tool.

## Logo / brand direction (open)

Working name: **AiAuditor**. Open to a punchier name — candidates:
- **AuditScan** / **AgentScan**
- **Veritext**
- **Audited.AI**
- **Compliant.so**

Visual direction: think *clinical*, *clean*, *verifiable*. Nutritional-facts panel is the hero visual. Type: serif for the legal-feel headlines, mono for the on-chain data. Colour: muted with strong status-colours for verdicts (green pass / amber partial / red fail).

## Repo / public links

- Site: **[8RR8.com](https://8RR8.com)**
- Code (open source): https://github.com/drhus/ai-auditor
- ERC-8004 reference: https://eips.ethereum.org/EIPS/eip-8004
- ERC-8004 deployed contracts: https://github.com/erc-8004/erc-8004-contracts
- 8004 ecosystem explorer: https://8004scan.io (200k+ agents indexed)
- EU AI Act reference: https://artificialintelligenceact.eu/
- Hacker-bob (inspiration): https://github.com/vmihalis/hacker-bob
