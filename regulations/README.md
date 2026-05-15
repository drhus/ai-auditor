# Regulations

This directory holds the regulation YAML packs that drive the checker library.

V1 targets:

- `eu-ai-act-2024-08.yaml` — EU AI Act, focused on code-checkable clauses (Art 6+Annex III, 9, 10, 12, 13, 14, 15, 50)
- `nist-ai-rmf-1.0.yaml` — NIST AI RMF 1.0 subcategories with code-mapped evidence
- `iso-iec-42001.yaml` — deferred to V1.5

Each clause is an atomic auditable requirement with:

- stable `id` (used in on-chain `AuditScored.clauseScores` packing)
- regulation source + version
- classification (`code` / `mixed` / `external`)
- signal dependencies (from the RECON stage)
- checker spec (deterministic rule + LLM-judge fallback)
- score mapping
- evidence schema
- remediation hint

Schema and the first decomposition pass are tracked in the project docs.
