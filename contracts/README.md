# Contracts

Solidity contracts for the on-chain attestation layer.

## `AiAuditorV1.sol`

Emits a compact `AuditScored` event per completed audit. The event holds the
canonical on-chain record:

| Field | Type | Meaning |
| --- | --- | --- |
| `agentId` | `uint256 indexed` | ERC-8004 tokenId of the audited agent |
| `bundleHash` | `bytes32 indexed` | sha256 of the canonical audit bundle |
| `commitSha` | `bytes32` | git commit SHA-1, padded |
| `treeSha` | `bytes32` | git tree SHA-1, padded (zero if unused) |
| `riskClass` | `uint8` | 0=unknown 1=min 2=lim 3=high 4=gpai |
| `overallScoreBp` | `uint16` | 0..4000 (score × 1000) |
| `regulationsVer` | `bytes32` | sha of YAML pack used |
| `checkerVer` | `bytes32` | sha of checker code at audit time |
| `auditedAt` | `uint64` | unix seconds |
| `clauseScores` | `bytes` | packed `[u16 clauseId, u8 verdict, u8 scoreTenths]` per clause |

For ~30 clauses, `clauseScores` is ~120 bytes. Total event ~320 bytes — comfortably one Sepolia tx.

In parallel, the same audit calls `validationResponse(requestHash, response,
responseURI, hash, tag)` on the canonical ERC-8004 ValidationRegistry so it
shows up in standard 8004 queries.

## Deployment (Foundry)

```bash
# Install foundry if needed
curl -L https://foundry.paradigm.xyz | bash
foundryup

# From repo root:
forge init --no-git --force foundry-tmp
cp contracts/AiAuditorV1.sol foundry-tmp/src/

cd foundry-tmp
forge build

# Deploy to Sepolia (needs RPC + private key)
export SEPOLIA_RPC_URL="https://go.getblock.io/2023ff1b546f442c850994e8d7d472a4"
export PRIVATE_KEY="<auditor wallet private key>"

forge create src/AiAuditorV1.sol:AiAuditorV1 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args "<auditor address, can be the same as deployer>"
```

Record the deployed address; set as `AI_AUDITOR_V1_ADDRESS_SEPOLIA` env var on
Vercel.

## ERC-8004 Validation Registry addresses

See `regulations/onchain-anchoring.md` in the project docs.

- Mainnets: `0x` (per ERC-8004 deploy — to be confirmed against the registry repo)
- Sepolia: `0x` (per ERC-8004 deploy — to be confirmed)
