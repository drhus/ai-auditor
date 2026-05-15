import type { AuditInput, ScopeResult } from "../types";

/**
 * V0 scope is just "which regulation packs to evaluate".
 * Currently echoes the user's selection; future versions can shrink
 * scope based on jurisdiction or expand on detected signals.
 */
export function runScope(input: AuditInput): ScopeResult {
  return {
    regulationIds: input.regulations,
    notes: [`Auditing against packs: ${input.regulations.join(", ")}`],
  };
}
