// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AiAuditorV1
 * @notice Emits a compact, indexed event for each completed AI agent audit.
 *
 * The event payload is the canonical on-chain record: a few fixed-size fields
 * plus a packed `clauseScores` byte string. The full report lives off-chain
 * (cached on our backend, content-addressed by `bundleHash`).
 *
 * Pairs with the canonical ERC-8004 ValidationRegistry on the same chain:
 * the same audit also calls `validationResponse(requestHash, response, uri,
 * hash, tag)` so audits show up in standard 8004 discovery queries.
 *
 * Reproducibility: anyone running the open-source checker at `checkerVersion`
 * against the audited repo at `commitSha` with the regulations YAML at
 * `regulationsVersion` should produce the same `bundleHash`. Mismatch = drift.
 */
contract AiAuditorV1 {
    address public immutable auditor;
    address public owner;

    /// @param agentId         ERC-8004 tokenId of the audited agent.
    /// @param bundleHash      sha256 of the canonical audit bundle.
    /// @param commitSha       git commit (SHA-1 padded to 32 bytes).
    /// @param treeSha         git tree (SHA-1 padded to 32 bytes); zero if unused.
    /// @param riskClass       0=unknown 1=min 2=lim 3=high 4=gpai.
    /// @param overallScoreBp  0..4000 (score x 1000).
    /// @param regulationsVer  sha of YAML pack used.
    /// @param checkerVer      sha of checker code at audit time.
    /// @param auditedAt       unix seconds (uint64 is fine through year 292 billion).
    /// @param clauseScores    Packed per-clause data. Each clause is 4 bytes:
    ///                        [uint16 clauseId][uint8 verdict][uint8 scoreTenths].
    event AuditScored(
        uint256 indexed agentId,
        bytes32 indexed bundleHash,
        bytes32 commitSha,
        bytes32 treeSha,
        uint8   riskClass,
        uint16  overallScoreBp,
        bytes32 regulationsVer,
        bytes32 checkerVer,
        uint64  auditedAt,
        bytes   clauseScores
    );

    /// Emitted when the auditor (or owner) revokes a previously published audit
    /// because the checker had a bug or the inputs were corrupted.
    event AuditRevoked(bytes32 indexed bundleHash, string reason);

    /// Emitted when ownership of the auditor wallet rotates.
    event OwnerChanged(address indexed previousOwner, address indexed newOwner);

    error NotAuditor();
    error NotOwner();
    error ScoresTooLarge();

    /// Cap clauseScores payload to ~1 KB (256 clauses). Generous; current packs
    /// have ~32 clauses (~128 bytes). Prevents griefing via giant blobs.
    uint256 public constant MAX_SCORES_BYTES = 1024;

    modifier onlyAuditor() {
        if (msg.sender != auditor && msg.sender != owner) revert NotAuditor();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(address _auditor) {
        auditor = _auditor;
        owner = msg.sender;
    }

    function publishAudit(
        uint256 agentId,
        bytes32 bundleHash,
        bytes32 commitSha,
        bytes32 treeSha,
        uint8   riskClass,
        uint16  overallScoreBp,
        bytes32 regulationsVer,
        bytes32 checkerVer,
        uint64  auditedAt,
        bytes calldata clauseScores
    ) external onlyAuditor {
        if (clauseScores.length > MAX_SCORES_BYTES) revert ScoresTooLarge();
        emit AuditScored(
            agentId,
            bundleHash,
            commitSha,
            treeSha,
            riskClass,
            overallScoreBp,
            regulationsVer,
            checkerVer,
            auditedAt,
            clauseScores
        );
    }

    function revokeAudit(bytes32 bundleHash, string calldata reason)
        external
        onlyAuditor
    {
        emit AuditRevoked(bundleHash, reason);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        emit OwnerChanged(owner, newOwner);
        owner = newOwner;
    }
}
