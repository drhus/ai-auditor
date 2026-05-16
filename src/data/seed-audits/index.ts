/**
 * Static seed audits bundled with the deploy.
 *
 * Each file is a real AuditReport produced by the V0 pipeline against a public
 * agent repo. They are pre-loaded into the in-memory store so the /audits
 * directory is never empty even when KV isn't provisioned.
 *
 * Add a new seed by running:
 *   npx tsx scripts/seed-audit.ts <owner>/<repo>
 * and moving the output JSON here, then importing below.
 */

import type { AuditReport } from "@/pipeline/types";

import hackerBob from "./aud_01KRQD9SJCVFBMS57S3F2G.json";
import gptEngineer from "./aud_01KRQDAGVF6RF0EA7B2TVE.json";
import openInterpreter from "./aud_01KRQDAP0FJXNXNHD4AQSK.json";
import autoGpt from "./aud_01KRQDAQQRPS5XB3ED36YW.json";

export const SEED_AUDITS: AuditReport[] = [
  hackerBob as unknown as AuditReport,
  gptEngineer as unknown as AuditReport,
  openInterpreter as unknown as AuditReport,
  autoGpt as unknown as AuditReport,
];
