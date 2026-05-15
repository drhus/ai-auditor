# AiAuditor

## Project Context

All specs, PRD, progress, and decisions live in the Obsidian vault.
Read these files before starting any major feature work:

- Overview: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/overview.md
- PRD: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/prd.md
- Pipeline design: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/pipeline-design.md
- Regulations matrix: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/regulations-matrix.md
- User journey: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/user-journey.md
- Progress: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/progress.md
- Conversation log: /home/agent/Documents/Second-Brain/10-projects/ai-auditor/conversation-log.md

## What this is

AiAuditor is an auditing AI agent that fetches a target AI agent's source repo (via GitHub URL or ERC-8004 agentId) and scores it against region-specific AI regulations (EU AI Act, NIST AI RMF, ISO/IEC 42001) with per-clause, code-anchored evidence.

Inspired by the hacker-bob (https://github.com/vmihalis/hacker-bob) MCP pipeline pattern — adapted from security findings to regulatory clauses.

## Stack

To be decided. Two candidates documented in `pipeline-design.md`:
- A: Node 20 + MCP server (mirrors hacker-bob).
- B: Python + LangGraph (richer regulatory/NLP ecosystem). Currently leaning B for the checker engine.
