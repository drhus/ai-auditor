import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { extract } from "tar";
import type { FetchResult, FileInventory } from "../types";

interface FetchOpts {
  owner: string;
  repo: string;
  ref?: string;                          // branch / sha — undefined = default branch
  auditId: string;
}

/**
 * Downloads a GitHub repo as a tarball, extracts to a sandbox dir.
 * Returns a FetchResult with file inventory and language breakdown.
 *
 * No `git` required — uses GitHub's tarball API. Works on Vercel.
 */
export async function fetchRepo(opts: FetchOpts): Promise<FetchResult> {
  const { owner, repo, auditId } = opts;

  // 1. Resolve the ref to a concrete SHA (so subsequent calls are reproducible).
  const meta = await getRepoMeta(owner, repo);
  const ref = opts.ref ?? meta.default_branch;
  const sha = await resolveRefToSha(owner, repo, ref);

  // 2. Download the tarball.
  const tarUrl = `https://codeload.github.com/${owner}/${repo}/tar.gz/${sha}`;
  const res = await fetch(tarUrl, {
    headers: { "User-Agent": "ai-auditor/0.0.1" },
  });
  if (!res.ok || !res.body) {
    throw new FetchError(`Tarball download failed: HTTP ${res.status}`);
  }

  // 3. Extract to a sandboxed worktree.
  const baseDir = path.join(os.tmpdir(), "ai-auditor", auditId);
  await fs.mkdir(baseDir, { recursive: true });

  // GitHub tarballs are wrapped in a single top-level dir like `repo-sha/`.
  await pipeline(
    Readable.fromWeb(res.body as never),
    extract({
      cwd: baseDir,
      strip: 1,                          // drop the wrapping directory
      filter: (p) => !shouldSkipPath(p),
    }),
  );

  // 4. Walk and inventory.
  const { fileCount, totalBytes, languages, inventory } = await inventoryDir(
    baseDir,
  );

  return {
    repoUrl: `https://github.com/${owner}/${repo}`,
    owner,
    repo,
    ref: sha,
    commitSha: sha,
    treeSha: undefined,
    worktreeDir: baseDir,
    fileCount,
    totalBytes,
    languages,
    inventory,
    fetchedAt: new Date().toISOString(),
  };
}

export class FetchError extends Error {}

async function getRepoMeta(owner: string, repo: string) {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ai-auditor/0.0.1",
      },
    },
  );
  if (!res.ok) {
    if (res.status === 404) {
      throw new FetchError(`Repo ${owner}/${repo} not found (404)`);
    }
    throw new FetchError(`Repo metadata fetch failed: HTTP ${res.status}`);
  }
  return (await res.json()) as { default_branch: string };
}

async function resolveRefToSha(
  owner: string,
  repo: string,
  ref: string,
): Promise<string> {
  // If ref already looks like a full SHA, accept it.
  if (/^[0-9a-f]{40}$/i.test(ref)) return ref.toLowerCase();

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits/${encodeURIComponent(ref)}`,
    {
      headers: {
        Accept: "application/vnd.github.sha",
        "User-Agent": "ai-auditor/0.0.1",
      },
    },
  );
  if (!res.ok) {
    throw new FetchError(`Could not resolve ref ${ref}: HTTP ${res.status}`);
  }
  const sha = (await res.text()).trim();
  if (!/^[0-9a-f]{40}$/.test(sha)) {
    throw new FetchError(`Resolver returned non-SHA: ${sha}`);
  }
  return sha;
}

function shouldSkipPath(p: string): boolean {
  // Drop heavy / noisy paths early during extraction.
  if (p.includes("/node_modules/")) return true;
  if (p.includes("/.git/")) return true;
  if (p.endsWith("/.git")) return true;
  if (p.includes("/__pycache__/")) return true;
  if (p.includes("/.next/")) return true;
  if (p.includes("/dist/")) return true;
  if (p.includes("/build/")) return true;
  if (p.includes("/vendor/")) return true;
  if (/\.(?:zip|tar|gz|whl|jar|dmg|exe|so|dylib|dll|onnx|pt|safetensors|bin)$/i.test(p))
    return true;
  return false;
}

// ---------------------------------------------------------------------------
// File inventory
// ---------------------------------------------------------------------------

async function inventoryDir(root: string): Promise<{
  fileCount: number;
  totalBytes: number;
  languages: Record<string, number>;
  inventory: FileInventory;
}> {
  const languages: Record<string, number> = {};
  let fileCount = 0;
  let totalBytes = 0;

  const governanceMatchers: Array<[keyof FileInventory, RegExp]> = [
    ["hasReadme", /^README(\.[\w]+)?$/i],
    ["hasLicense", /^LICEN[SC]E(\.[\w]+)?$/i],
    ["hasModelCard", /^MODEL[_-]?CARD(\.[\w]+)?$/i],
    ["hasDataCard", /^DATA[_-]?CARD(\.[\w]+)?$/i],
    ["hasRiskRegister", /^RISK[_-]?REGISTER(\.[\w]+)?$/i],
    ["hasThreatModel", /^THREAT[_-]?MODEL(\.[\w]+)?$/i],
    ["hasSecurityMd", /^SECURITY(\.[\w]+)?$/i],
    ["hasPrivacyMd", /^PRIVACY(\.[\w]+)?$/i],
    ["hasCodeOfConduct", /^CODE[_-]?OF[_-]?CONDUCT(\.[\w]+)?$/i],
    ["hasContributing", /^CONTRIBUTING(\.[\w]+)?$/i],
  ];

  const inventory: FileInventory = {
    hasReadme: false,
    hasLicense: false,
    hasModelCard: false,
    hasDataCard: false,
    hasRiskRegister: false,
    hasThreatModel: false,
    hasSecurityMd: false,
    hasPrivacyMd: false,
    hasCodeOfConduct: false,
    hasContributing: false,
    hasCiWorkflows: false,
    hasEvalDir: false,
    hasTestsDir: false,
    governanceDocFiles: [],
    configFiles: [],
  };

  async function walk(dir: string) {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".git") continue;
        if (rel === ".github/workflows") inventory.hasCiWorkflows = true;
        if (/^(evals?|benchmarks?)$/i.test(e.name)) inventory.hasEvalDir = true;
        if (/^(tests?|__tests__|spec|specs)$/i.test(e.name)) inventory.hasTestsDir = true;
        await walk(full);
        continue;
      }
      if (!e.isFile()) continue;
      fileCount++;
      let size = 0;
      try {
        size = (await fs.stat(full)).size;
      } catch {
        /* skip */
      }
      totalBytes += size;
      const ext = path.extname(e.name).toLowerCase();
      const lang = LANG_BY_EXT[ext];
      if (lang) languages[lang] = (languages[lang] ?? 0) + size;

      const base = e.name;
      const isAtRoot = path.dirname(rel) === "" || path.dirname(rel) === ".";
      if (isAtRoot && /^(package\.json|pyproject\.toml|requirements\.txt|Cargo\.toml|go\.mod|Gemfile)$/.test(base)) {
        inventory.configFiles.push(rel);
      }
      for (const [k, re] of governanceMatchers) {
        if (re.test(base)) {
          (inventory as unknown as Record<string, unknown>)[k] = true;
          inventory.governanceDocFiles.push(rel);
        }
      }
    }
  }

  await walk(root);
  return { fileCount, totalBytes, languages, inventory };
}

const LANG_BY_EXT: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".py": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".rb": "Ruby",
  ".java": "Java",
  ".kt": "Kotlin",
  ".swift": "Swift",
  ".c": "C",
  ".h": "C",
  ".cpp": "C++",
  ".hpp": "C++",
  ".cs": "C#",
  ".php": "PHP",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".html": "HTML",
  ".css": "CSS",
  ".scss": "CSS",
  ".md": "Markdown",
  ".mdx": "Markdown",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".json": "JSON",
  ".sql": "SQL",
  ".sol": "Solidity",
};
