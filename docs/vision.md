---
tags:
  - project
  - vision
  - north-star
parent: "[overview](./overview.md)"
shareable: yes
---

# AiAuditor — Vision

The long-term arc. Use this when explaining the project beyond V1.

## North star

**Every piece of AI software in the world carries a live, on-chain compliance score that updates with the code.**

Buyers worldwide can verify in 30 seconds, before they integrate, that an AI agent meets the regulations of their jurisdiction. Builders worldwide can ship into any market without spending months on jurisdiction-specific compliance work — because they've already shipped the audit alongside the code.

## The problem we're solving

AI is global. Regulation is local. This mismatch is killing cross-border AI commerce.

- Excellent AI agents are being built in China, the EU, the US, the UK, India, Korea, and many other markets.
- Each market has (or is rapidly building) its own AI regulation: EU AI Act, NIST AI RMF, UK AI Safety Institute frameworks, China's GenAI Measures, Japan's AI Promotion Act.
- Compliance is **not transferable**. A team that built a stellar agent in one jurisdiction has to spend months and tens of thousands of euros proving it complies with the rules of every other jurisdiction they want to sell into.
- Manual audits cost **€25k–€150k** and take **weeks to months**. Long enough to kill the market window.
- The result: world-class AI products that should be selling globally are stuck in their home market because nobody Western will integrate them without a recognisable compliance trail.

This is especially true for Chinese AI teams shipping technically world-class products. The technology is there. The regulatory bridge is not.

## What we're building

A protocol and a service that makes AI compliance **portable**:

1. **Read the code.** Any GitHub repo, or any ERC-8004 registered agent.
2. **Score it.** Multi-stage audit pipeline (RECON → MAP → CHECK → VERIFY → GRADE → REPORT) against jurisdiction-specific regulation packs.
3. **Anchor it.** Compact on-chain attestation — packed clause scores + canonical ERC-8004 validation response.
4. **Verify it.** Anyone, anywhere, in 30 seconds. The audit is reproducible: same checker version + same regulations version + same commit = same bundle hash.
5. **Re-run it.** Every commit triggers a new attestation. The score evolves with the code. Trust is current, not stale.

## The five-version roadmap

### V0 — Front door (today)

Landing page + ERC-8004 agent intake + repo resolution + waitlist. Proves the URL → audit → result flow.

### V1 — Full pipeline (6 weeks)

- 20+ clause checkers across EU AI Act and NIST AI RMF.
- Sepolia testnet deployment.
- Public directory of audits, per-agent timelines.
- Privacy tiers: free public attestation, paid private audit.
- Open-source checker library — anyone can re-run for independent verification.

### V2 — Continuous attestation (8–12 weeks post-V1)

- **GitHub App** with `contents:read` scope.
- Webhook on every push to main; re-audits diff-relevant clauses.
- New attestation per audit-relevant commit. Old attestations remain — the on-chain history is the project's compliance timeline.
- CI status check ("AiAuditor: 2.8/4.0 — Article 14 oversight degraded") visible in pull requests.

### V3 — Self-audit via MCP (3–4 months)

- **MCP server** (Model Context Protocol) exposing the audit tool.
- Claude Code, Codex, autonomous coding agents can call `audit(repo, sha)` before they recommend or execute a deploy.
- "I shouldn't deploy this — Article 12 logging just regressed."
- Agents become compliance-aware by default.

### V4 — Multi-jurisdiction (4–6 months)

- One audit, scored against multiple regulation packs in parallel.
- User picks destination markets at intake: EU + US + UK + Japan + Singapore + China (for re-exports back).
- Output is a per-market scorecard: "passes EU AI Act high-risk; passes NIST RMF; partial against Japan's AI Promotion Act."
- Regulation packs are versioned, public, and community-maintainable.

### V5 — Decentralised audit market (6–12 months)

- AiAuditor becomes the canonical founding validator on ERC-8004's Validation Registry — but **not the only one**.
- Anyone can run our open-source checker and post attestations under the same schema.
- A trust graph emerges: validators stake reputation on each other's accuracy; the protocol surfaces the most-trusted validators.
- AiAuditor's moat is being the reference implementation, the most widely cited validator, and the operator of the highest-quality regulation packs.

## Parallel axis — verifiable provenance (TEE)

The roadmap above grows the *audit*. This axis grows the *guarantee* — proving that the agent you're talking to is the same code we audited.

The bare audit answers "did the code at commit X comply?". On its own it leaves three gaps:

1. **Build gap.** Did the binary deployed actually come from commit X, or from a quietly-modified branch?
2. **Runtime gap.** Is the binary the user is talking to *right now* the binary that was built from commit X, or has it been swapped?
3. **Host gap.** Does the operator have backdoors that let them mutate the agent's behaviour outside the audited code path?

TEE-based attestations close all three:

| Stage | TEE adds | Attestation content | Verifier |
| ----- | -------- | ------------------- | -------- |
| Build (V3.5) | Reproducible build inside a TEE (e.g. AWS Nitro Enclave, Intel TDX, AMD SEV-SNP) | `{ commitSha, builderEnclaveMeasurement, binaryHash }` | Anyone — re-builds in same enclave, expects same hash |
| Deploy (V4.5) | TEE-hosted runtime (Phala, Marlin, Automata, Flashbots TEE) | `{ binaryHash, runtimeEnclaveMeasurement, signedAttestation }` | Anyone — challenges the running enclave, gets a signed attestation |
| Live verify (V5.5) | Per-session attestation challenge | `{ sessionId, runtimeAttestation, transcript }` | The user, in-browser, before sending a sensitive prompt |

Each stage emits its own on-chain artefact, chained to the prior:

```
auditAttestation (V1)
   ↓ buildHash
buildAttestation (V3.5) — proves binary came from audited commit
   ↓ runtimeMeasurement
runtimeAttestation (V4.5) — proves running enclave is the attested binary
   ↓ sessionId
sessionProof (V5.5) — proves THIS request was served by THAT enclave
```

End-to-end pitch: *"The audit is true. The build matches the audit. The runtime matches the build. The agent you're talking to right now matches the runtime. Every link verifiable on chain, in 30 seconds."*

This is what separates "we believe the agent is compliant" from "we can mathematically prove the agent you're using is compliant." It's also the answer to the hardest objection from Western enterprise buyers: *"how do I know the deployed system is what was audited?"*

Tech foundation already exists — we're integrating, not inventing:
- **Reproducible builds in TEEs**: Stagex, Nix in enclaves, Flashbots `tdx-build`.
- **TEE attestation services**: AWS Nitro, Azure Confidential VMs, Intel TDX, AMD SEV-SNP, Phala, Marlin.
- **On-chain attestation registries**: Automata's attestation contracts, Phala's on-chain attestation, EAS with TEE-typed schemas.

V3.5 ships build-only attestation for the simplest case (a Dockerised agent, single binary, reproducible build). V4.5 extends to runtime. V5.5 ships in-browser per-session verification — the user clicks "verify this conversation", their browser challenges the enclave, the agent replies with a signed attestation, the browser cross-references against on-chain audit + build chain.

## Why now

**The deadline.** The EU AI Act becomes fully applicable on **2 August 2026**. Penalties reach **€35M or 7% of global turnover**. The entire global AI-agent industry is racing toward this date with no off-the-shelf way to prove compliance.

**The ecosystem.** ERC-8004 went live on Ethereum mainnet on 29 January 2026. **200,000+ AI agents** are already registered, with thousands more arriving weekly. The standard for AI agent identity on chain has emerged — and it's natively designed for third-party validation.

**The buyers.** Western enterprises are starting to require compliance trails before procuring AI from any vendor — let alone from foreign vendors. The procurement gap is now a market-access barrier, and it's only widening.

**The technology.** Multi-agent code-analysis pipelines (semgrep + LLM judges, AST-driven static analysis) have matured to the point where automated regulatory audit is achievable, not just aspirational.

## The three-angle pitch

Pick the angle that fits the audience. All three describe the same product.

**Authority — for regulators and buyers:**
> *The FDA stamp for AI agents — earned in minutes, not years.*

**Aspiration — for builders and the ecosystem:**
> *Michelin stars for AI agents — every score public, every audit on chain.*

**Public good — for press, BGA, civic audiences:**
> *A nutrition label for AI — what's inside, what's safe, at a glance.*

## What's not in the vision

- We don't replace **lawyers**, **Notified Bodies**, or **conformity-assessment processes**. We produce technical evidence to feed into those processes — and to short-circuit the easy 80% of compliance work that today consumes a disproportionate amount of money and time.
- We don't audit **prompt content** in real time. The audit reads the code, not the runtime behaviour of the agent.
- We don't manage **post-market monitoring obligations**, GDPR DPIAs, or organisational governance. Those remain the builder's responsibility — we surface them as "external controls — please confirm".

## How we know we've won

- A Chinese AI team ships into the EU with an AiAuditor attestation as part of their procurement package — and the customer accepts it.
- A Western enterprise procurement template includes "must have current AiAuditor attestation" as a required line item.
- The ERC-8004 Validation Registry shows AiAuditor as the most-cited validator across registered agents.
- An autonomous agent declines to deploy itself because its own MCP-driven self-audit returned a regression.

## Adjacent / future expansions

- Beyond AI: the same primitive (auditable software → on-chain attestation) generalises to any compliance regime that can be code-checked — supply-chain SBOM compliance, financial-services software, medical-device software. AiAuditor is the AI vertical of a broader compliance-attestation protocol.
- Beyond Ethereum: cross-chain attestations via standard bridges. The audit is the product; the chain is plumbing.
- Beyond English: regulation packs in original-language source plus translations, scored against the official text not a summary.
