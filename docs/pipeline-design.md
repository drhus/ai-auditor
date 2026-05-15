---
tags:
  - project
  - pipeline
  - architecture
parent: "[overview](./overview.md)"
inspired_by: "https://github.com/vmihalis/hacker-bob"
---

# AiAuditor — Pipeline Design

## TL;DR

Hacker-bob's MCP-orchestrated pipeline does **security** triage on a target: `RECON → AUTH → HUNT → CHAIN → VERIFY → GRADE → REPORT`. We rebrand the same scaffolding into a **regulation-audit** pipeline:

```
INTAKE → FETCH → RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT
```

Each stage produces structured artefacts the next stage consumes — same "MCP runtime coordinates handoff" pattern hacker-bob uses, just with regulatory checkers in place of vuln hunters.

## Side-by-side mapping

| hacker-bob (security)       | AiAuditor (regulation)             | Why the swap                                                                 |
| --------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| —                           | **INTAKE**                         | New stage: take agentId or repo URL, resolve which.                          |
| —                           | **FETCH**                          | New stage: clone repo (OAuth if private), pin commit SHA, build worktree.    |
| RECON (subdomains, hosts)   | RECON (stack, deps, model usage)   | Same idea — passive enumeration of the target's surface.                     |
| AUTH (login profiles)       | SCOPE (region + regulation set)    | Replaced: instead of authed sessions, we pick which regulations apply.       |
| HUNT (parallel scanners)    | CHECK (parallel clause checkers)   | Same idea — fan-out specialised probes.                                      |
| CHAIN (combine findings)    | MAP (Article 6 / Annex III mapping)| Cross-clause reasoning: does this trigger high-risk classification?          |
| VERIFY (independent re-run) | VERIFY (LLM-judge + heuristic)     | Same — second-pass confirmation before scoring.                              |
| GRADE (severity, submit?)   | GRADE (per-clause score 0–4)       | Same — quantification step.                                                  |
| REPORT (md report)          | REPORT (md + JSON, code-anchored)  | Same artefact shape, different content.                                      |

## Stage details

### 0. INTAKE

**Input:** one of:
- `repo_url` — GitHub URL (public or private).
- `erc8004_agent_id` — `{namespace}:{chainId}:{identityRegistry}:{tokenId}` per [ERC-8004](https://eips.ethereum.org/EIPS/eip-8004) spec.

**Action:**
- If `agent_id`: call Identity Registry `agentURI()` → fetch JSON → look for `services[].endpoint` with role `"source"` / `"repository"`, or `getMetadata(agentId, "repository")`. Persist on-chain agent profile alongside repo.
- If `repo_url`: skip ERC-8004 lookup.
- Probe access: HEAD on `https://api.github.com/repos/{owner}/{name}`. If 404 / 403 → request **GitHub App OAuth** with `contents:read` scope on that single repo.

**Output:** `intake.json` — `{ source, repo_url, agent_profile?, oauth_token_handle? }`. Token is held in a short-lived session store, never written to disk.

### 1. FETCH

**Action:**
- `git clone --depth=200` (depth gives us enough history for blame/decision evidence but bounds size).
- Record HEAD SHA — every later artefact references it for reproducibility.
- Drop the worktree into an ephemeral, sandboxed directory (`/tmp/ai-auditor/{run_id}/`).
- Generate **SBOM** with `syft` (deps are evidence for many clauses — e.g. "uses a known-restricted base model").
- Compute a file inventory: language buckets, line counts, presence of `MODEL_CARD.md`, `DATA_CARD.md`, `EVAL/`, `tests/`, `LICENSE`, `.github/workflows/`.

**Output:** `fetch.json` — `{ sha, sbom, file_inventory, languages }`.

### 2. RECON — passive stack and surface enumeration

Mirror of hacker-bob's RECON but pointed at the codebase, not the network. Fan-out reads (parallel, deterministic, no LLM yet):

| Detector             | What it finds                                                          | Why it matters for regulation                                                  |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `model_usage`        | Which model providers/IDs are called (OpenAI, Anthropic, HF, local)    | Article 50 transparency; Annex III high-risk triggers via model class          |
| `agent_framework`    | LangChain, LangGraph, CrewAI, AutoGen, raw SDK, MCP server             | Frames where to look for tool-call logging, human-in-the-loop hooks            |
| `data_io`            | Network calls, file I/O, scrapers, web search tools                    | Data governance (Art. 10), GDPR overlap, content provenance (Art. 50)          |
| `pii_signals`        | `email`, `ssn`, `passport`, `address` patterns in prompts/schemas      | Data quality + risk management evidence                                       |
| `bio_health_signals` | `patient`, `diagnosis`, `prescription`, ICD codes                      | Annex III high-risk: healthcare classification                                 |
| `employment_signals` | `cv`, `resume`, `candidate`, `applicant`, `score`                      | Annex III high-risk: employment classification                                 |
| `bio_metric_signals` | `face`, `voice`, `iris`, `fingerprint`                                 | Annex III high-risk: biometric ID                                              |
| `logging_hooks`      | Structured logging libs, OTEL, audit-log functions                     | Article 12 (record-keeping), Article 26 (deployer logs)                        |
| `oversight_hooks`    | `human_input`, approval gates, kill-switches                           | Article 14 human oversight                                                     |
| `eval_artefacts`     | `evals/`, `benchmarks/`, `tests/eval/`                                 | Article 15 accuracy/robustness                                                 |
| `provenance_hooks`   | C2PA, watermarking, content labelling                                  | Article 50(2) synthetic content disclosure                                     |
| `cybersec_hooks`     | Prompt-injection defences, output filters, rate limiting               | Article 15 cybersecurity                                                       |
| `governance_docs`    | `MODEL_CARD.md`, `DATA_CARD.md`, `RISK_REGISTER.md`, `THREAT_MODEL.md` | NIST AI RMF GOVERN evidence                                                    |

Each detector is a deterministic function over the worktree → produces a list of evidence records `{ detector, file, lines, snippet, signal }`. No LLM yet — keeps the cost floor low and the evidence reproducible.

**Output:** `recon.json` — `{ detectors: [ {name, findings[]} ] }`.

### 3. SCOPE — regulation set selection

User input + RECON output drive which regulations and which clauses apply:

- **User chooses region(s):** EU (AI Act), US (NIST AI RMF, sector-specific), International (ISO/IEC 42001). Multi-select. Default = EU.
- **From RECON signals, derive Annex-III / sector flags:** `is_biometric`, `is_employment`, `is_health`, `is_education`, `is_lawenf`, `is_critical_infra`, etc.
- **Hard-coded "in-scope-always" clauses** for any AI agent: Article 50 transparency, Article 12 logging, Article 14 oversight, NIST GOVERN-1, MAP-1, MEASURE-2, MANAGE-4.
- **Marked-external clauses are flagged but skipped from auto-checking:** legal entity in EU/EEA, post-market monitoring contract, conformity-assessment Notified Body — see [regulations-matrix](./regulations-matrix.md).

**Output:** `scope.json` — `{ regulations: [...], in_scope_clauses: [...], external_clauses: [...], rationale: [...] }`.

### 4. MAP — risk classification

Cross-clause reasoning step (hacker-bob's "CHAIN" analogue). The interesting question for EU AI Act isn't "did the code pass clause X?" but **"is this thing high-risk in the first place?"** That decision changes the entire downstream check set.

- **Article 6(1)** safety component test: requires external info (we'll mark as external in [regulations-matrix](./regulations-matrix.md) — but we surface code signals that *suggest* a safety-component role).
- **Article 6(2) + Annex III** test: derive from RECON signals (biometric/employment/health/education/lawenf/migration/justice/critical infra). If any trigger → high-risk.
- **Article 50 GPAI signals:** detect generative content, chatbot interactions, deepfake-capable models.

Output is the **risk classification decision tree** with each branch citing the RECON evidence that drove it.

**Output:** `map.json` — `{ classification: "high-risk" | "limited-risk" | "minimal-risk" | "gpai" | "unknown", branches: [...], applicable_articles: [...] }`.

### 5. CHECK — parallel clause checkers

Hacker-bob's HUNT step. For each in-scope clause:

```
ClauseChecker(repo, recon, sbom) →
  {
    clause_id,
    verdict: "pass" | "partial" | "fail" | "n/a" | "external",
    evidence: [{ file, lines, why }],
    confidence: 0..1,
    cost_tokens: int
  }
```

Two checker types:

1. **Deterministic** — pattern matches, AST queries, SBOM lookups. Fast, free, reproducible. Examples: "Article 12 logging" passes if `logging`/`OTEL` is imported AND used in tool-call boundaries.
2. **LLM-judge** — Claude or GPT with the clause text + relevant code chunks. Only invoked when deterministic checker returns "partial" or where the clause is inherently linguistic (e.g. "Are the disclosures in Article 50 actually disclosed *to the user*?"). Bounded by max-tokens per clause.

Run in parallel with bounded concurrency. Cache by `(clause_id, sha)` so re-runs after fixes only re-check changed clauses.

**Output:** `check.json` — array of clause results.

### 6. VERIFY — independent second pass

Hacker-bob's VERIFY. For every `fail` or `pass`-with-low-confidence, run a second checker variant (different model, or rule + LLM combo) and require agreement. Disagreements drop to `partial` + flag for human review.

**Output:** `verify.json` — same shape as CHECK but with `verified: true|disagree`.

### 7. GRADE — scoring

Per-clause numeric score on a 0–4 ordinal:

| Score | Label             | Meaning                                                           |
| ----- | ----------------- | ----------------------------------------------------------------- |
| 4     | Strong            | Pass + verified + high confidence                                 |
| 3     | Adequate          | Pass + verified + medium confidence, or pass with minor gaps      |
| 2     | Partial           | Some controls present but incomplete or inconsistent              |
| 1     | Inadequate        | Controls missing or contradicted by code                          |
| 0     | Absent            | No evidence found at all                                          |
| —     | N/A or External   | Excluded from numeric average; explained in the report            |

Per-area aggregation: mean (or weighted mean) of scores within each Article / NIST subcategory. Top-level score per regulation = weighted mean across in-scope areas.

### 8. REPORT — output

Two artefacts:

1. **`report.md`** — narrative, per-Article sections, every finding linked to GitHub permalinks (`{repo}/blob/{sha}/{file}#L{start}-L{end}`).
2. **`report.json`** — machine-readable for the front-end UI to render dashboards, diffs across runs, and re-audit deltas.

Both include:
- Top-line score per regulation.
- Risk classification result from MAP.
- Section per Article/subcategory with clause findings.
- Separate "External controls — please confirm" section listing the clauses we can't see from the repo.
- "Remediation playbook": for each fail/partial, a concrete next step.

## Concurrency / runtime

- Stages 0–2 are sequential (each consumes the prior output).
- Stage 5 (CHECK) is the fan-out — bounded parallel (e.g. 8 workers).
- Stage 6 (VERIFY) parallel within itself.
- Stages 3, 4, 7, 8 are sequential aggregators.

End-to-end target: **<10 min on a typical agent repo** (≈50k LoC).

## Stack choice (open)

Two candidates:

**Option A — Mirror hacker-bob:** Node 20 + MCP server. Pros: closest copy of the working pattern, MCP host adapters (Claude Code/Codex) come for free. Cons: regulatory-NLP libraries are weaker in Node.

**Option B — Python + LangGraph:** Pros: richer ecosystem (`langgraph`, `langfair`, `aif360`, structured outputs, vector DBs). Cons: have to build MCP integration ourselves; less mirrored on hacker-bob.

**Recommendation:** Python + LangGraph for the checker engine; thin Node MCP layer if/when we want CLI/IDE integration. Decided in a follow-up.

## What we re-use from hacker-bob, almost literally

- Stage-by-stage handoff via JSON artefacts persisted under a session directory (`~/.ai-auditor/sessions/{run_id}/`).
- "Optional tools" pattern — pipeline runs with degraded RECON if `syft` / `semgrep` aren't installed; better with them.
- VERIFY-before-GRADE rule (no score without two-pass confirmation).
- MCP runtime as the orchestrator if/when we go Node, otherwise LangGraph supervisor.
- Local evidence handling: nothing PHI/secret leaves the user's machine without explicit consent.
