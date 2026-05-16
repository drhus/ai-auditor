/**
 * scripts/seed-audit.ts
 *
 * Runs the audit pipeline directly against a public GitHub repo and writes the
 * resulting AuditReport JSON to public/seed-audits/. These are then loaded by
 * the store at runtime so /audits is never empty even without KV provisioned.
 *
 * Usage:
 *   npx tsx scripts/seed-audit.ts <owner/repo> [<owner/repo> ...]
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { runAudit } from "../src/pipeline/run.js";
import { generateAuditId } from "../src/pipeline/id.js";
import type { AuditInput } from "../src/pipeline/types.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: tsx scripts/seed-audit.ts <owner/repo> [<owner/repo> ...]");
    process.exit(1);
  }

  const seedDir = path.join(process.cwd(), "public", "seed-audits");
  await fs.mkdir(seedDir, { recursive: true });

  for (const target of args) {
    const m = target.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (!m) {
      console.error(`skip ${target}: not owner/repo`);
      continue;
    }
    const [, owner, repo] = m;
    const input: AuditInput = {
      auditId: generateAuditId(),
      source: { kind: "repo", owner, repo },
      repoUrl: `https://github.com/${owner}/${repo}`,
      regulations: ["eu-ai-act-2024-08", "nist-ai-rmf-1.0"],
    };

    console.log(`\n=== ${owner}/${repo} (id=${input.auditId}) ===`);
    const t0 = Date.now();
    try {
      const report = await runAudit(input, (evt) => {
        if (evt.kind === "log") console.log(`  [${evt.stage}] ${evt.text}`);
        else if (evt.kind === "stage") console.log(`  [${evt.stage}] phase=${evt.phase}${evt.durationMs ? ` (${evt.durationMs}ms)` : ""}`);
        else if (evt.kind === "classification") console.log(`  ✦ risk=${evt.classification} annex=${evt.annexIii.join("/")} art50=${evt.art50.join("/")}`);
        else if (evt.kind === "score") console.log(`  Σ overall=${evt.overall.toFixed(2)}`);
        else if (evt.kind === "error") console.error(`  ✗ ${evt.message}`);
      });
      const file = path.join(seedDir, `${input.auditId}.json`);
      await fs.writeFile(file, JSON.stringify(report, null, 2));
      console.log(`✓ wrote ${file}`);
      console.log(`✓ overall ${report.grade.overallScore.toFixed(2)} · ${Date.now() - t0}ms`);
    } catch (e) {
      console.error(`✗ audit failed for ${owner}/${repo}:`, e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
