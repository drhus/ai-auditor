# AiAuditor

## Project Context

All specs, PRD, progress, and decisions live in two places:

1. **In this repo**, under `docs/` — public, GitHub-rendered, the version anyone can read.
2. **Canonical source**: the project vault at `/home/agent/Documents/Second-Brain/10-projects/ai-auditor/`. When the two diverge, the vault wins.

Read these files before starting any major feature work:

- Overview: `docs/overview.md`
- PRD: `docs/prd.md`
- Pipeline design: `docs/pipeline-design.md`
- Regulations matrix: `docs/regulations-matrix.md`
- User journey: `docs/user-journey.md`
- On-chain anchoring: `docs/onchain-anchoring.md`
- V0 MVP spec: `docs/v0-mvp-spec.md`
- Team brief: `docs/team-brief.md`
- Progress: `docs/progress.md`
- Conversation log: `docs/conversation-log.md`

## What this is

AiAuditor is an auditing AI agent that fetches a target AI agent's source repo (via GitHub URL or ERC-8004 agentId) and scores it against region-specific AI regulations (EU AI Act, NIST AI RMF, ISO/IEC 42001) with per-clause, code-anchored evidence.

## Stack

V0 is Next.js + TypeScript + viem; the audit pipeline runs in-process.
Future considerations documented in `docs/pipeline-design.md`.
