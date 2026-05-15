---
tags:
  - project
  - ux
parent: "[overview](./overview.md)"
---

# AiAuditor — User Journey

End-to-end flow from landing page to scored audit report. Mirrors hacker-bob's "low-friction one-command" feel — but on the web.

## High-level flow

```
LAND  →  INPUT  →  AUTH? →  RUN  →  STREAM  →  REPORT  →  REMEDIATE LOOP
```

## 1. LAND

Single-page landing. Above the fold:
- Headline: "Audit your AI agent against the EU AI Act in minutes."
- Sub: "Paste a GitHub URL or an ERC-8004 agent ID. We read the code and grade you, clause by clause."
- Single input field with two modes (toggle): `repo URL` | `ERC-8004 agentId`.
- Region/regulation selector below (default: EU AI Act ticked; NIST AI RMF + ISO 42001 unticked).

## 2. INPUT

Two paths, same output:

**Path A — Repo URL:**
- User pastes `https://github.com/owner/repo` (or `git@…`).
- Validate format client-side.
- Background: `HEAD https://api.github.com/repos/{owner}/{repo}`.
  - 200 → public, jump to RUN.
  - 404/403 → private or non-existent → ask for OAuth (next step).

**Path B — ERC-8004 agentId:**
- User pastes `1:1:0xABC…:42` (chain:chainId:registry:tokenId) or a short form.
- Server calls Identity Registry `tokenURI(42)` on the appropriate chain → fetch JSON.
- Display the agent profile (name, description, image, services).
- Try to extract repo URL from:
  1. `services[]` where `role` ∈ `{"source","repository","code"}`.
  2. On-chain `getMetadata(agentId, "repository")` / `"source"` / `"github"`.
  3. Heuristic: any `https://github.com/...` URL in the registration file.
- If repo URL found → confirm with user → continue to access probe (Path A from here).
- If not found → show the agent profile + a "paste your repo URL" fallback.

## 3. AUTH (only if private repo)

**Mechanism:** GitHub App (not OAuth App), so we can ask for **fine-grained, single-repo** read access only — no org-wide scope. Token is per-session, never persisted.

- Click "Authorize on GitHub" → standard GitHub App install flow scoped to the target repo.
- On callback, validate token can read `contents` on the specific repo.
- Continue to RUN.

**Security commitments shown to the user:**
- Token held in memory + short-lived encrypted session store; deleted after run completes (or 24h, whichever sooner).
- Cloned code lives in an ephemeral sandbox; deleted after report generation.
- No code or secrets sent to third-party model providers without a per-clause LLM-judge call (and even then, only the minimum chunk needed).

## 4. RUN

- Show a "Run starting" panel; assign a `run_id`.
- Pipeline stages (from [pipeline-design](./pipeline-design.md)) run server-side; status streamed to the browser.
- User sees a live progress bar with stage labels:

```
[✓] Intake        — repo identified
[✓] Fetch         — repo cloned at sha abc1234
[●] Recon         — detecting agent framework, model usage, signals…
[ ] Scope
[ ] Map
[ ] Check         — 0/24 clauses
[ ] Verify
[ ] Grade
[ ] Report
```

Stage transitions stream over SSE (server-sent events) or websocket.

## 5. STREAM

As soon as MAP completes, show the **provisional risk classification** ("Likely high-risk under Annex III §1(a)" + the code evidence). Even if the rest of the run is still going, the user gets the headline early.

As CHECK runs, individual clause results stream in. Each result card shows:
- Clause ID + name.
- Verdict chip (`pass` / `partial` / `fail` / `external` / `n/a`).
- One-line rationale.
- "View evidence" expands to file:line snippets with GitHub permalinks.

## 6. REPORT

Final view, all clauses settled:

- Top: scorecard.
  - Per regulation: 0–4 average + radar chart per Article/subcategory.
  - Risk classification verdict.
  - Count of `fail` / `partial` clauses.
- Body: tabs for each regulation. Inside each tab, sections per Article/subcategory with all clause cards.
- Side panel: "External controls — please confirm" — the **E** clauses from [regulations-matrix](./regulations-matrix.md) listed as checklist items. Each one a yes/no the user can self-attest (re-score updates the report).
- Footer: "Re-run on latest commit" button — repeats the pipeline pointed at HEAD of the same branch; previous run is preserved so diffs are visible.
- Export: download `report.md` + `report.json`.

## 7. REMEDIATE LOOP

For each `fail` or `partial`, the report includes a **remediation hint** linking the clause to:
- Concrete code change ("Add structured logging at `agent.py:tool_call_handler` — see Article 12 checklist").
- A "Create a GitHub issue from this finding" button (uses the existing OAuth scope).
- A "Generate PR with fix" button — V2 feature, deferred.

User pushes commits → re-runs the audit → sees the score move.

## What we explicitly *don't* do in V1

- No team workspaces, sharing, or SSO.
- No on-prem / self-hosted runner — repo cloning happens in our infra (or local dev for now).
- No live runtime / behavioural testing of the agent (no prompts sent to the deployed agent).
- No PDF report. Markdown + JSON only.
