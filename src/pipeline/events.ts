import type { AuditReport, SignalId, RiskClassification, SectionScore } from "./types";

export type StageName =
  | "intake"
  | "fetch"
  | "recon"
  | "scope"
  | "map"
  | "check"
  | "verify"
  | "grade"
  | "report";

export type AuditEvent =
  | { kind: "ready"; auditId: string; startedAt: string }
  | {
      kind: "stage";
      stage: StageName;
      phase: "start" | "complete";
      at: string;
      durationMs?: number;
      note?: string;
    }
  | { kind: "log"; stage: StageName; text: string; tone?: "info" | "warn" | "ok" | "muted" }
  | {
      kind: "signal";
      signal: SignalId;
      fired: boolean;
      strength: number;
      hits: number;
      label?: string;
    }
  | {
      kind: "classification";
      classification: RiskClassification;
      annexIii: string[];
      art50: string[];
      rationale: string[];
    }
  | {
      kind: "clause";
      clauseId: string;
      regulationId: string;
      article: string;
      title: string;
      verdict: string;
      score: number;
      rawScore: number;
      rulesMatched: number;
      rulesTotal: number;
    }
  | { kind: "score"; overall: number; perRegulation: SectionScore[] }
  | { kind: "report"; report: AuditReport }
  | { kind: "error"; message: string };

export type OnAuditEvent = (event: AuditEvent) => void;

export const noopEmitter: OnAuditEvent = () => {};
