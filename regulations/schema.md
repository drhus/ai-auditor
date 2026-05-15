# Regulation Pack Schema

Every regulation we audit against lives in this directory as a YAML file. The schema below is the contract between the regulation pack and the audit pipeline.

## File layout

```yaml
regulation:
  id: eu-ai-act                  # stable kebab-case slug
  full_name: "Regulation (EU) 2024/1689 — Artificial Intelligence Act"
  version: "2024-08"             # publication / effective date
  source: <official URL>
  enforcement_dates:
    - { phase: "prohibited", date: "2025-02-02" }
    - { phase: "gpai",       date: "2025-08-02" }
    - { phase: "high-risk",  date: "2026-08-02" }
  clause_id_namespace: "0x0C"    # top byte of on-chain clauseId

annex_iii_triggers:              # only for regulations with risk classification
  - signal: bio_metric_signals
    category: "1(a)"
    description: "Remote biometric identification"

clauses:
  - id: eu-ai-act/art-12/p1
    clause_id_bytes: 0x0C121
    article: "12(1)"
    title: "Automatic logging of events"
    subject: ["provider"]
    classification: code
    text: |
      <verbatim or near-verbatim regulation text>
    in_scope_when:
      risk_classifications: [high]
      annex_iii_categories: [any]
      always: false
    signals_required:
      - logging_hooks
      - agent_framework
    checker:
      deterministic:
        - rule: <detector or composite rule name>
          weight: 0.5
          description: <human explanation>
      llm_judge:
        invoke_when: deterministic_partial
        prompt_id: art-12-p1
        max_input_chunks: 8
    score_mapping:
      pass: 4
      partial_high: 3
      partial: 2
      partial_low: 1
      fail: 0
    evidence_schema: [file, lines, snippet, rule]
    remediation_hint: |
      <actionable, code-level advice>
    external_notes: |
      <what humans still need to verify outside the code>
```

## Field reference

### `id`

Stable, hierarchical, kebab-case: `{regulation}/{article}/{paragraph}`. Once published, never renamed. If a clause is deprecated, mark `deprecated: true` and keep the id.

### `clause_id_bytes`

16-bit numeric ID used in the on-chain `AuditScored.clauseScores` packed payload. The top byte is the regulation namespace (`0x0C` = EU AI Act, `0x01–0x04` = NIST AI RMF G/M/M/M). The bottom byte is unique within the regulation. Never reused.

### `subject`

Who the clause obliges. Members of: `provider | deployer | importer | distributor | gpai_provider`. Most clauses oblige `provider` (the builder of the system).

### `classification`

- **`code`** — fully audit-able from the repo. Deterministic checker produces a definitive verdict.
- **`mixed`** — primary evidence is code-side, but requires supporting documentation (model card, data card, risk register, etc.) that may exist outside the repo. We flag missing docs.
- **`external`** — cannot be audited from the repo alone (legal entity location, contracts, post-market monitoring policies). We surface as "please confirm" in the report.

### `in_scope_when`

Predicate that decides whether the clause runs at all for a given target:

- `risk_classifications`: list of risk classes that activate the clause (`high`, `limited`, `minimal`, `gpai`).
- `annex_iii_categories`: list of Annex III category IDs that activate (only useful for EU AI Act).
- `always: true` — clause runs regardless (e.g. Article 5 prohibited practices).

### `signals_required`

List of RECON detectors whose output the checker needs. The pipeline ensures all required detectors run before the checker. Available signals:

| Signal | What it detects |
| --- | --- |
| `agent_framework` | LangChain, LangGraph, CrewAI, AutoGen, raw SDK usage |
| `model_usage` | Which LLM providers/models are called |
| `logging_hooks` | Structured logging libraries + usage at tool-call boundaries |
| `oversight_hooks` | Human-in-the-loop hooks, approval gates, kill-switches |
| `eval_artefacts` | `evals/`, benchmark scripts, eval test suites |
| `governance_docs` | `MODEL_CARD.md`, `DATA_CARD.md`, `RISK_REGISTER.md`, etc. |
| `cybersec_hooks` | Rate limiting, prompt-injection defences, output filters |
| `provenance_hooks` | C2PA, watermarking, content provenance |
| `data_io` | Network calls, file I/O, scrapers |
| `pii_signals` | PII patterns in prompts/configs |
| `bio_health_signals` | Healthcare-domain terms (Annex III §5) |
| `employment_signals` | HR / candidate-screening terms (Annex III §4) |
| `bio_metric_signals` | Biometric ID / categorisation (Annex III §1) |
| `education_signals` | Education / academic-screening terms (Annex III §3) |
| `law_enforcement_signals` | Law-enforcement terms (Annex III §6) |
| `migration_signals` | Border / asylum terms (Annex III §7) |
| `justice_signals` | Court / democratic-process terms (Annex III §8) |
| `essential_services_signals` | Credit, insurance, essential public services (Annex III §5) |
| `critical_infra_signals` | Critical infrastructure (Annex III §2) |
| `content_generation_signals` | Image/audio/video/text generation (triggers Art 50(2)) |
| `emotion_recognition_signals` | Emotion recognition systems (Art 5(1)(f) / Art 50(3)) |

### `checker`

Two layers, both optional but at least one required:

- **`deterministic`** — list of rules. Each rule is a named function in `src/pipeline/checkers/` that returns `{ matched: boolean | "partial", evidence: EvidenceRecord[], confidence: number }`. Composite score = weighted sum.
- **`llm_judge`** — invoked when deterministic is ambiguous (`partial_score in [0.3, 0.7]`). Prompts live in `src/pipeline/checkers/prompts/{prompt_id}.md`. Stubbed in V0 — falls through to `partial` verdict with note.

### `score_mapping`

Translates composite checker output to a 0–4 ordinal:

| Score | Label | Source |
| --- | --- | --- |
| 4 | Strong | deterministic ≥ 0.9 + (no LLM judge required OR LLM judge agreed) |
| 3 | Adequate | deterministic ≥ 0.7 |
| 2 | Partial | deterministic 0.4–0.7 OR LLM judge disagreed |
| 1 | Inadequate | deterministic 0.1–0.4 |
| 0 | Absent | deterministic < 0.1 |
| n/a | Not applicable | clause out of scope per `in_scope_when` |
| external | External | classification = external |

### `remediation_hint`

What the builder should DO to move the score up. Concrete, code-level. Not legal advice.

### `external_notes`

What we cannot tell from the code. Surfaced in the "External Controls — please confirm" sidebar of the report.

## Versioning

- A regulation YAML file is named `{regulation-id}-{version}.yaml`.
- The `regulationsVersion` field anchored on chain is the SHA-256 of the YAML file content.
- New revisions ship as a new file (`eu-ai-act-2024-08.yaml` → `eu-ai-act-2025-03.yaml`). Clause IDs remain stable across versions; deprecated clauses keep their ID with `deprecated: true`.

## Validating a pack

```ts
import { loadRegulationPack } from "@/pipeline/loader";
const pack = await loadRegulationPack("eu-ai-act-2024-08");
// Throws on schema violations, duplicate clause IDs, unknown signal names.
```
