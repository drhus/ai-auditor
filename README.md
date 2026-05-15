# AiAuditor

Audit and score AI agents against regulation. Point us at a GitHub repo or an ERC-8004 agentId; get a per-clause report against the EU AI Act, NIST AI RMF, and ISO/IEC 42001 — every finding anchored to a file and line.

> Status: scoping / Day 0. No code yet.

## Pipeline

```
INTAKE → FETCH → RECON → SCOPE → MAP → CHECK → VERIFY → GRADE → REPORT
```

Adapted from [hacker-bob](https://github.com/vmihalis/hacker-bob)'s security-audit pipeline. Full design in the project docs.

## Docs

Project documentation lives in the [Second Brain vault](https://github.com/drhus/second-brain) under `10-projects/ai-auditor/`:

- `overview.md` — landing summary
- `prd.md` — product requirements
- `pipeline-design.md` — stage-by-stage pipeline
- `regulations-matrix.md` — code-checkable vs external clause split
- `user-journey.md` — site flow

## License

TBD.
