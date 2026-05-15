---
tags:
  - project
  - architecture
  - onchain
parent: "[overview](./overview.md)"
---

# AiAuditor — On-chain Anchoring

How an audit becomes a publicly verifiable record on Sepolia, with no IPFS in V1.

## Design goals

1. **Every clause score independently readable on chain** — no off-chain trust required to see "did this agent pass Article 12?".
2. **Compact** — one transaction's worth of data should hold all clause scores. Sub-200 bytes for a 30-clause audit.
3. **Standard-compatible** — appears in canonical ERC-8004 Validation Registry queries, not just our custom contract.
4. **Self-contained** — clause IDs, regulation version, and checker version all encoded so the audit is reinterpretable later.
5. **No IPFS, no Arweave** in V1. Rich content (evidence snippets, rationale) cached server-side, anchored by `bundleHash`.

## What goes on chain per audit (Sepolia)

**Two transactions per public audit.** Optional third for the request side of 8004's validation flow.

### Transaction 1 — `AiAuditorV1.AuditScored` (our event)

The fat one. Holds the actual data points.

```solidity
contract AiAuditorV1 {
    address public immutable auditor;
    address public owner;

    event AuditScored(
        uint256 indexed agentId,          // ERC-8004 tokenId
        bytes32 indexed bundleHash,       // sha256(canonical audit bundle)
        bytes32 commitSha,                // git commit (SHA-1, padded)
        bytes32 treeSha,                  // git tree (SHA-1, padded)
        uint8   riskClass,                // 0=unknown 1=min 2=lim 3=high 4=gpai
        uint16  overallScoreBp,           // 0..4000 (score × 1000)
        bytes32 regulationsVersion,       // SHA of YAML pack used
        bytes32 checkerVersion,           // SHA of checker code
        uint64  auditedAt,                // unix seconds
        bytes   clauseScores              // packed per-clause data
    );

    function publishAudit(
        uint256 agentId,
        bytes32 bundleHash,
        bytes32 commitSha,
        bytes32 treeSha,
        uint8   riskClass,
        uint16  overallScoreBp,
        bytes32 regulationsVersion,
        bytes32 checkerVersion,
        uint64  auditedAt,
        bytes   calldata clauseScores
    ) external onlyAuditor { /* emit */ }
}
```

### `clauseScores` packing

Each clause is **4 bytes**: `uint16 clauseId | uint8 verdict | uint8 scoreTenths`.

| Bytes | Field           | Meaning                                                              |
| ----- | --------------- | -------------------------------------------------------------------- |
| 0..1  | `clauseId`      | Stable numeric ID from our regulation pack (e.g. `0x0C01` = EU-AIA Art.12 §1) |
| 2     | `verdict`       | `0=n/a` `1=external` `2=fail` `3=partial` `4=pass`                   |
| 3     | `scoreTenths`   | 0..40 (score × 10). `0xFF` for n/a/external.                         |

For 30 clauses → **120 bytes** of `clauseScores`. Add the fixed-size fields (≈200 bytes) and we're at ~320 bytes per audit. Comfortably one transaction on Sepolia, ~£0 even on mainnet L2s.

### Clause ID namespace

| Prefix    | Regulation        |
| --------- | ----------------- |
| `0x01xx`  | NIST AI RMF GOVERN |
| `0x02xx`  | NIST AI RMF MAP   |
| `0x03xx`  | NIST AI RMF MEASURE |
| `0x04xx`  | NIST AI RMF MANAGE |
| `0x0Cxx`  | EU AI Act         |
| `0x0Dxx`  | ISO/IEC 42001 (V1.5) |

Within EU AI Act:
- `0x0C01..` = Art 12 (logging) sub-clauses
- `0x0C02..` = Art 14 (oversight)
- `0x0C03..` = Art 15 (robustness/cyber)
- `0x0C05..` = Art 50 (transparency)
- etc.

The full mapping lives in `regulations/clause-ids.yaml` — pinned per `regulationsVersion`.

### Transaction 2 — `ERC8004.ValidationRegistry.validationResponse`

The canonical one. Makes our audit discoverable through standard 8004 queries.

```solidity
ValidationRegistry.validationResponse(
    requestHash,                               // matches a validationRequest
    response: 1=pass | 2=partial | 3=fail,
    responseURI: "https://aiauditor.app/a/{auditId}",
    hash: bundleHash,                          // same as AuditScored.bundleHash
    tag: "eu-ai-act@2024-08"                   // primary regulation tag
);
```

Anyone calling `ValidationRegistry.getAgentValidations(agentId)` sees our audit alongside other validators. `getSummary(agentId, [auditorAddress], tag)` filters to just us.

### Optional Transaction 0 — `validationRequest`

For V1 we self-request: same address calls `validationRequest()` first, then `validationResponse()`. Cheap. Future: the agent owner submits the request to signal consent.

```solidity
ValidationRegistry.validationRequest(
    validator: auditorAddress,
    agentId,
    requestURI: "https://aiauditor.app/a/{auditId}/request",
    hash: bundleHash
);
```

## Reading the audit back

Front-end / dashboard flow:

1. User lands on `/a/{auditId}`.
2. Server resolves `auditId → AuditScored event` (cached, indexed in Postgres).
3. Client gets the event log + decodes `clauseScores` to a `[{clauseId, verdict, score}, …]`.
4. Client cross-references each `clauseId` to the human-readable text from `regulations/{ver}.yaml`.
5. Client fetches `/api/audit/{auditId}/evidence` from our server for the rich snippets.
6. UI renders nutritional-facts panel + full report.
7. "Verify on chain" button links to Sepolia explorer for the tx.
8. "Re-run audit" button — for the agent owner, triggers a fresh audit.

## Reproducibility contract

For an audit to be third-party verifiable:

- `regulationsVersion` SHA → must resolve to a public copy of the YAML used (V1: git in this repo; later: IPFS).
- `checkerVersion` SHA → must resolve to a public copy of the checker code at that commit.
- `commitSha`+`treeSha` → identifies the exact repo state audited.
- `bundleHash` = `sha256(canonical_json({intake, recon, check, verify, grade, fixed_metadata}))`.

Anyone can: clone our checker at `checkerVersion`, clone the audited repo at `commitSha`, load `regulationsVersion`, run the pipeline, compute `bundleHash`, compare. Mismatch = we lied or one of the inputs drifted.

## Custodial wallet — `auditorAddress`

A single hot wallet on Sepolia, holds:
- Sepolia ETH for gas (faucet-funded).
- Authorisation to call `AiAuditorV1.publishAudit` (our contract, `onlyAuditor` modifier).
- Authorisation to call `ValidationRegistry.validationResponse` (we self-elect as validator).

Wallet is a server-side key in `vercel env` (production) / `.env.local` (dev). Rotate on schedule. No NFT custody in V1 (we drop auto-registration), so blast radius is just attesting.

## Deployment plan

| Step | Action                                                                                   |
| ---- | ---------------------------------------------------------------------------------------- |
| 1    | Confirm Sepolia deployment addresses for ERC-8004 Identity + Validation Registry         |
| 2    | Generate auditor hot wallet, fund from Sepolia faucet                                    |
| 3    | Write + test `AiAuditorV1.sol` with Foundry                                              |
| 4    | Deploy `AiAuditorV1` on Sepolia, verify on Etherscan                                     |
| 5    | Wire backend signer to both contracts, dry-run with a stub audit                         |
| 6    | First real audit: publish, verify reverse-decode in browser                              |

## Future — mainnet and non-8004 path

Not in V1, but pre-thought so the schema doesn't need redesigning:

- **Mainnet:** same contracts, deployed to Base (cheap L2, fits the ERC-8004 / Coinbase axis). Move `regulationsVersion` and reports to IPFS (CID anchored in attestation).
- **Non-8004 agents:** fall back to **EAS** with the same data shape, just under an EAS schema instead of `AuditScored`. Front-end treats both as the same audit type.
- **Revocation:** EAS has it natively; ERC-8004 Validation Registry doesn't currently. If we need revocation in V1, we emit an `AuditRevoked(bundleHash, reason)` event from our contract.

## Open

- Final Sepolia deployment addresses for the canonical 8004 registries (need to confirm before contract integration).
- Clause ID stability rules — when EU AI Act gets revised, do clause IDs change or do we keep them and bump `regulationsVersion`? Lean: keep IDs stable, only deprecate.
- Whether to emit a single `AuditScored` event or split into `AuditStarted` / `AuditCompleted`. Single keeps it cheaper.
