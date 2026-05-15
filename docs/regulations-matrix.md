---
tags:
  - project
  - regulations
  - compliance
parent: "[overview](./overview.md)"
---

# AiAuditor — Regulations Matrix

Per-clause classification: **code-checkable** (we can audit by reading the repo) vs **external** (depends on company, jurisdiction, contracts, governance docs we can't see). This drives [pipeline-design § 3-scope-regulation-set-selection](./pipeline-design.md#3-scope-regulation-set-selection).

Legend:
- **C** — Code-checkable. Repo evidence exists; clause-checker can produce a verdict.
- **C/D** — Partly code-checkable. Some signals from code, but final answer needs document evidence.
- **E** — External. Cannot be audited from the repo alone (we flag and ask the user).

## EU AI Act

### Title II — Prohibited practices (Article 5)

| Clause | Topic                                                            | Class | Notes                                                                                 |
| ------ | ---------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------- |
| 5(1)(a) | Subliminal / manipulative techniques                            | C     | Detect prompt patterns and dark-pattern UI strings in code.                            |
| 5(1)(b) | Exploiting vulnerabilities (age, disability, socio-economic)    | C     | Detect targeting by protected attributes in prompts/configs.                           |
| 5(1)(c) | Social scoring by public authorities                            | C/D   | Code may signal scoring + classification; deployer context is external.                |
| 5(1)(d) | Predictive policing solely from profiling                       | C     | Detect law-enforcement signals + risk-score outputs.                                   |
| 5(1)(e) | Untargeted facial scraping                                       | C     | Detect scraper code targeting face datasets.                                           |
| 5(1)(f) | Emotion recognition in workplace/education                      | C     | Detect emotion-recognition libraries used with HR/edu signals.                         |
| 5(1)(g) | Biometric categorisation by protected attributes                | C     | Detect biometric pipelines that bucket by race/political opinion/etc.                  |
| 5(1)(h) | Real-time remote biometric ID in public spaces                  | E     | Deployment context (public space, real-time) is operational, not in code.              |

### Title III — High-risk AI (Articles 6–27)

| Clause     | Topic                                            | Class | What the checker looks for                                                       |
| ---------- | ------------------------------------------------ | ----- | -------------------------------------------------------------------------------- |
| Art. 6(1)  | Safety component of regulated product            | E     | Requires knowledge of the product context; user-confirmed.                       |
| Art. 6(2) + Annex III | High-risk use case                    | C     | RECON signals (biometric/employment/health/edu/lawenf/migration/justice/infra).  |
| Art. 9     | Risk management system                           | C/D   | Code: tests, evals, guardrails. Docs: `RISK_REGISTER.md`, `THREAT_MODEL.md`.     |
| Art. 10    | Data and data governance                         | C/D   | Code: dataset loaders, deduplication, bias-audit scripts. Docs: `DATA_CARD.md`.  |
| Art. 11    | Technical documentation                          | C/D   | Presence of `MODEL_CARD.md`, `docs/`, `README` quality, ADRs.                    |
| Art. 12    | Record-keeping / logging                         | C     | Structured logging on tool calls, OTEL, audit-log writer.                       |
| Art. 13    | Transparency to deployers                        | C/D   | README + in-code disclosures; deployer-facing instructions.                      |
| Art. 14    | Human oversight                                  | C     | Human-in-the-loop hooks, approval gates, kill-switch, override paths.            |
| Art. 15    | Accuracy, robustness, cybersecurity              | C     | Eval suite, regression tests, prompt-injection defences, rate limits.            |
| Art. 16    | Provider obligations (overall)                   | C/D   | Aggregate; partially satisfied by other clauses + governance docs.                |
| Art. 17    | Quality management system                        | E     | Org-level QMS, not in repo.                                                      |
| Art. 18    | Documentation retention (10y)                    | E     | Retention policy; out of scope.                                                  |
| Art. 19    | Automatic logs retention                         | C/D   | Code: log-export interface. Policy: external.                                    |
| Art. 20    | Corrective actions / withdrawal                  | E     | Process, not code.                                                               |
| Art. 21    | Cooperation with authorities                     | E     | Org process.                                                                     |
| Art. 22    | Authorised representative (non-EU providers)    | E     | Legal entity.                                                                    |
| Art. 23    | Importer obligations                             | E     | Supply-chain role.                                                               |
| Art. 24    | Distributor obligations                          | E     | Supply-chain role.                                                               |
| Art. 26    | Deployer obligations                             | C/D   | Code: deployer-facing logging API. Org: training, oversight policy.              |
| Art. 27    | Fundamental rights impact assessment (FRIA)      | E     | Deployer org doc, not in repo.                                                   |

### Title IV — Transparency obligations (Article 50)

| Clause   | Topic                                                | Class | What the checker looks for                                                  |
| -------- | ---------------------------------------------------- | ----- | --------------------------------------------------------------------------- |
| 50(1)    | "You're interacting with AI" disclosure              | C     | UI strings, system prompts, API response wrappers that disclose AI nature.  |
| 50(2)    | Synthetic content marking (audio/image/video/text)   | C     | C2PA / watermarking libraries; metadata writers; output post-processing.   |
| 50(3)    | Emotion-recognition / biometric-cat. disclosure      | C     | Disclosure path when emotion-rec or biometric-cat code is detected.        |
| 50(4)    | Deepfake disclosure                                  | C     | Generation pipelines + disclosure step.                                    |

### Title V — General-purpose AI models (Articles 51–55)

| Clause | Topic                                       | Class | Notes                                                          |
| ------ | ------------------------------------------- | ----- | -------------------------------------------------------------- |
| 53     | Technical documentation, copyright policy   | C/D   | `MODEL_CARD.md`, copyright filter code, training data summary.|
| 54     | EU authorised rep (non-EU GPAI providers)   | E     | Legal entity.                                                  |
| 55     | Systemic-risk GPAI obligations              | C/D   | Eval suite, adversarial testing scripts. Risk reporting: doc. |

## NIST AI RMF 1.0

Subcategory-level. Many GOVERN items are policy docs (E), MAP/MEASURE/MANAGE skew code-checkable.

| Subcategory | Topic                                                                 | Class | Repo signal                                                       |
| ----------- | --------------------------------------------------------------------- | ----- | ----------------------------------------------------------------- |
| GOVERN 1.1  | Legal/regulatory requirements understood                              | E     | Policy doc.                                                       |
| GOVERN 1.4  | Risk management process documented                                    | C/D   | `RISK_REGISTER.md`.                                              |
| GOVERN 1.5  | Ongoing monitoring + periodic review                                  | C/D   | CI re-runs of evals, drift monitors.                              |
| GOVERN 4.1  | Organizational practices for safe AI                                  | E     | Org charter.                                                      |
| GOVERN 5.1  | Engaging stakeholders/affected communities                            | E     | Org process.                                                      |
| MAP 1.1     | Context of use established                                            | C/D   | README, `MODEL_CARD.md` intended-use section.                     |
| MAP 2.3     | Scientific validity and TEVV considerations                           | C     | Evals dir, benchmark scripts.                                     |
| MAP 3.4     | Risks/benefits to people identified                                   | C/D   | `RISK_REGISTER.md` + code signals.                                |
| MAP 5.1     | Likelihood + magnitude of impacts documented                          | C/D   | Risk register, code signals.                                      |
| MEASURE 1.1 | Approaches and metrics defined                                        | C     | `evals/`, metric definitions.                                     |
| MEASURE 2.3 | Performance / reliability tested                                      | C     | Test suite, benchmark scripts.                                    |
| MEASURE 2.4 | Generalisability evaluated                                            | C     | OOD / robustness tests.                                           |
| MEASURE 2.7 | Security / resilience evaluated                                       | C     | Prompt-injection tests, fuzz tests.                               |
| MEASURE 2.8 | Privacy risk evaluated                                                | C     | PII detection, redaction tests.                                   |
| MEASURE 2.10| Explainability / interpretability                                     | C/D   | Explainer libs / code; method docs.                               |
| MEASURE 2.11| Fairness / bias evaluated                                             | C     | Fairness eval scripts (langfair, aif360).                         |
| MEASURE 3.1 | Risk tracking infrastructure                                          | C/D   | Issue tracker integration, metrics dashboards.                    |
| MANAGE 1.1  | Risks prioritised, treated, monitored                                 | C/D   | Risk register + CI gates.                                         |
| MANAGE 2.3  | Mechanisms for AI deactivation/decommission                           | C     | Kill-switch code, feature flag for disable.                       |
| MANAGE 4.1  | Post-deployment monitoring, appeal/override, change mgmt              | C     | Monitoring hooks, override paths, versioning.                     |
| MANAGE 4.3  | Incident response, recovery, communication                            | C/D   | Runbooks, alerting code.                                          |

## ISO/IEC 42001 (deferred; outline only)

| Area                            | Class | Notes                                                       |
| ------------------------------- | ----- | ----------------------------------------------------------- |
| 4 Context of the organisation   | E     | Org-level.                                                  |
| 5 Leadership                    | E     | Org-level.                                                  |
| 6 Planning (impact assessment)  | C/D   | Risk register + code signals.                               |
| 7 Support (competence, comms)   | E     | Org-level.                                                  |
| 8 Operation (controls)          | C/D   | Most code-side overlap with NIST MEASURE/MANAGE.            |
| 9 Performance evaluation        | C     | Evals + monitoring.                                         |
| 10 Improvement                  | C/D   | Change mgmt, retros.                                        |

## Decision rules for the checker

1. If clause is **E**: never auto-score; always surface in the "External controls — please confirm" section of the report.
2. If clause is **C/D**: deterministic checker uses code signal as primary; LLM-judge can be invoked on adjacent docs (`MODEL_CARD.md`, `README`); always end with "supporting docs may exist outside the repo".
3. If clause is **C**: deterministic checker is authoritative; LLM-judge only for ambiguous "partial" results.
4. Code/external split is a property of the clause, not the repo. We do not auto-mark clauses as external based on findings — only based on the matrix.

## To validate before V1 lock

- [ ] Compliance-savvy reviewer (legal or GRC) sanity-checks the C / C/D / E split for EU AI Act.
- [ ] We confirm Annex III sectoral triggers are detectable from RECON signals (counter-examples to find).
- [ ] We define the source-of-truth YAML format for clauses (likely `regulations/eu-ai-act.yaml` etc. in repo).
