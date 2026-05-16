// On-chain payload encoder.
//
// Pure function: AuditReport + RegulationPacks → the exact arguments
// AiAuditorV1.publishAudit expects, plus the companion data we'll feed to
// ERC-8004 ValidationRegistry.validationResponse.
//
// Spec: docs/onchain-anchoring.md — each clause is 4 bytes packed as
// [uint16 clauseId][uint8 verdict][uint8 scoreTenths], canonical-sorted by
// clauseIdBytes. Verdict byte: 0=n/a 1=external 2=fail 3=partial 4=pass.
// scoreTenths = round(score × 10) ∈ [0,40], or 0xFF for n/a/external.
// SHA-1 commit/tree hashes are zero-padded on the right to 32 bytes so the
// leading 20 bytes are the SHA itself.

import crypto from "node:crypto";
import type { AuditReport, RegulationPack, Verdict } from "./types";
import { loadRegulationPacks } from "./loader";

export type RiskClassByte = 0 | 1 | 2 | 3 | 4;
export type VerdictByte = 0 | 1 | 2 | 3 | 4;

export interface ClauseEntry {
  clauseId: string;
  clauseIdBytes: number;
  verdict: Verdict;
  verdictByte: VerdictByte;
  scoreTenths: number;
}

export interface OnchainPayload {
  // AiAuditorV1.publishAudit args
  agentId: string;                   // uint256 as decimal string for JSON safety
  bundleHash: `0x${string}`;         // bytes32
  commitSha: `0x${string}`;          // bytes32 (SHA-1 left-aligned, zero-padded right)
  treeSha: `0x${string}`;            // bytes32 (zero if unknown)
  riskClass: RiskClassByte;
  overallScoreBp: number;            // 0..4000
  regulationsVersion: `0x${string}`; // bytes32 — sha256 of primary pack YAML
  checkerVersion: `0x${string}`;     // bytes32 — sha256 of checker version string
  auditedAt: string;                 // uint64 unix seconds as decimal string
  clauseScores: `0x${string}`;       // packed bytes (≤ MAX_SCORES_BYTES)
  // ValidationRegistry.validationResponse companion
  validationResponse: 1 | 2 | 3;     // 1=pass | 2=partial | 3=fail
  responseUri: string;
  primaryTag: string;
  // Decoded view for UX / debugging
  entries: ClauseEntry[];
  meta: {
    clausesEncoded: number;
    clausesDroppedNoBytesId: number;
    clausesDroppedNa: number;
    bytesLength: number;
  };
}

// Mirrors AiAuditorV1.MAX_SCORES_BYTES.
export const MAX_SCORES_BYTES = 1024;
const NA_SCORE_TENTHS = 0xff;

const VERDICT_BYTE: Record<Verdict, VerdictByte> = {
  "n/a": 0,
  external: 1,
  fail: 2,
  partial: 3,
  pass: 4,
};

const RISK_BYTE: Record<string, RiskClassByte> = {
  unknown: 0,
  minimal: 1,
  limited: 2,
  high: 3,
  gpai: 4,
};

export async function encodeOnchainPayload(
  report: AuditReport,
  packsArg?: RegulationPack[],
): Promise<OnchainPayload> {
  const packs =
    packsArg ?? (await loadRegulationPacks(report.scope.regulationIds));

  const clauseIdByName = new Map<string, number>();
  for (const pack of packs) {
    for (const c of pack.clauses) {
      if (c.clauseIdBytes) clauseIdByName.set(c.id, c.clauseIdBytes);
    }
  }

  let droppedNoBytesId = 0;
  let droppedNa = 0;
  const entries: ClauseEntry[] = [];
  for (const c of report.checks) {
    const bytesId = clauseIdByName.get(c.clauseId);
    if (!bytesId) {
      droppedNoBytesId++;
      continue;
    }
    if (c.verdict === "n/a") {
      // n/a clauses don't anchor — they're "out of scope for this risk class".
      // The off-chain report still lists them; on-chain we save the bytes.
      droppedNa++;
      continue;
    }
    const verdictByte = VERDICT_BYTE[c.verdict];
    const scoreTenths =
      c.verdict === "external" || !Number.isFinite(c.score)
        ? NA_SCORE_TENTHS
        : Math.max(0, Math.min(40, Math.round(c.score * 10)));
    entries.push({
      clauseId: c.clauseId,
      clauseIdBytes: bytesId,
      verdict: c.verdict,
      verdictByte,
      scoreTenths,
    });
  }
  entries.sort((a, b) => a.clauseIdBytes - b.clauseIdBytes);

  const clauseScores = packClauseScores(entries);
  // Safety: encoder MUST stay under the contract cap.
  const bytesLength = (clauseScores.length - 2) / 2;
  if (bytesLength > MAX_SCORES_BYTES) {
    throw new Error(
      `clauseScores payload ${bytesLength} bytes exceeds contract cap ${MAX_SCORES_BYTES}`,
    );
  }

  const primaryPack = packs[0];
  const primaryTag = primaryPack
    ? `${primaryPack.familyId}@${primaryPack.version}`
    : "unknown";

  const auditedAtSec = Math.floor(Date.parse(report.completedAt) / 1000);

  return {
    agentId: parseAgentId(report.input.agentId),
    bundleHash: bytes32FromHex(report.bundleHash),
    commitSha: padSha1Bytes32(report.fetch.commitSha),
    treeSha: report.fetch.treeSha
      ? padSha1Bytes32(report.fetch.treeSha)
      : zeroBytes32(),
    riskClass: RISK_BYTE[report.map.classification] ?? 0,
    overallScoreBp: Math.max(
      0,
      Math.min(4000, Math.round(report.grade.overallScore * 1000)),
    ),
    regulationsVersion: bytes32FromHex(primaryPack?.packSha ?? ""),
    checkerVersion: bytes32FromHex(
      crypto.createHash("sha256").update(report.checkerVersion, "utf8").digest("hex"),
    ),
    auditedAt: String(auditedAtSec),
    clauseScores,
    validationResponse: aggregateValidationResponse(report),
    responseUri: `https://8RR8.com/a/${report.auditId}`,
    primaryTag,
    entries,
    meta: {
      clausesEncoded: entries.length,
      clausesDroppedNoBytesId: droppedNoBytesId,
      clausesDroppedNa: droppedNa,
      bytesLength,
    },
  };
}

function packClauseScores(entries: ClauseEntry[]): `0x${string}` {
  const buf = Buffer.alloc(entries.length * 4);
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    buf.writeUInt16BE(e.clauseIdBytes & 0xffff, i * 4);
    buf.writeUInt8(e.verdictByte, i * 4 + 2);
    buf.writeUInt8(e.scoreTenths & 0xff, i * 4 + 3);
  }
  return `0x${buf.toString("hex")}` as `0x${string}`;
}

function parseAgentId(raw?: string): string {
  if (!raw) return "0";
  try {
    return BigInt(raw).toString(10);
  } catch {
    return "0";
  }
}

function bytes32FromHex(hex: string): `0x${string}` {
  const stripped = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (stripped.length === 0) return zeroBytes32();
  if (stripped.length > 64) {
    return `0x${stripped.slice(0, 64)}` as `0x${string}`;
  }
  return `0x${stripped.padStart(64, "0")}` as `0x${string}`;
}

// SHA-1 is 20 bytes (40 hex). Pack into bytes32 left-aligned so the leading
// 20 bytes are the SHA-1 itself and the trailing 12 bytes are zero. A reader
// can recover the SHA-1 by taking bytes32[0..20).
function padSha1Bytes32(sha1: string): `0x${string}` {
  const stripped = sha1.startsWith("0x") ? sha1.slice(2) : sha1;
  if (stripped.length === 0) return zeroBytes32();
  if (stripped.length >= 64) {
    return `0x${stripped.slice(0, 64)}` as `0x${string}`;
  }
  return `0x${stripped.padEnd(64, "0")}` as `0x${string}`;
}

function zeroBytes32(): `0x${string}` {
  return `0x${"00".repeat(32)}` as `0x${string}`;
}

function aggregateValidationResponse(report: AuditReport): 1 | 2 | 3 {
  // ValidationRegistry expects 1=pass | 2=partial | 3=fail. Map from our
  // overall ordinal score: >=3 pass, 2 partial, <=1 fail.
  const overall = report.grade.overallScore;
  if (overall >= 3) return 1;
  if (overall >= 2) return 2;
  return 3;
}
