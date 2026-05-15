import { isSupportedSlug, type SupportedSlug } from "./chains";

export interface ParsedAgent {
  kind: "agent";
  chain: SupportedSlug;
  tokenId: bigint;
}

export interface ParsedRepo {
  kind: "repo";
  host: "github.com";
  owner: string;
  repo: string;
  ref?: string;
}

export type ParsedInput = ParsedAgent | ParsedRepo;

const SCAN_HOSTS = new Set(["8004scan.io", "www.8004scan.io"]);
const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);

export function parseAgentInput(input: string): ParsedInput {
  let trimmed = input.trim().replace(/\s+/g, "");

  // Accept URLs without scheme: `github.com/foo/bar`, `8004scan.io/agents/...`.
  // Add `https://` so the URL constructor doesn't choke.
  if (!/^https?:\/\//i.test(trimmed) && /^(?:www\.)?(?:github\.com|8004scan\.io)\//i.test(trimmed)) {
    trimmed = "https://" + trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return parseUrl(trimmed);
  }

  const compact = parseCompactRef(trimmed);
  if (compact) return compact;

  const shorthand = parseRepoShorthand(trimmed);
  if (shorthand) return shorthand;

  throw new ParseError(
    "Paste an 8004scan.io URL, a GitHub repo URL, or a chain:tokenId / owner/repo reference.",
  );
}

function parseUrl(raw: string): ParsedInput {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ParseError("Not a valid URL.");
  }

  if (SCAN_HOSTS.has(url.hostname)) {
    return parseScanPath(url);
  }
  if (GITHUB_HOSTS.has(url.hostname)) {
    return parseGithubPath(url);
  }

  throw new ParseError(
    `Unsupported host "${url.hostname}". Use an 8004scan.io URL or a github.com URL.`,
  );
}

function parseScanPath(url: URL): ParsedAgent {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3 || segments[0] !== "agents") {
    throw new ParseError("URL should look like /agents/{chain}/{tokenId}.");
  }

  const chainSlug = segments[1].toLowerCase();
  if (!isSupportedSlug(chainSlug)) {
    throw new ParseError(`Unsupported chain "${chainSlug}".`);
  }

  const tokenIdStr = segments[2];
  if (!/^\d+$/.test(tokenIdStr)) {
    throw new ParseError(`Token ID "${tokenIdStr}" must be a positive integer.`);
  }

  return { kind: "agent", chain: chainSlug, tokenId: BigInt(tokenIdStr) };
}

function parseGithubPath(url: URL): ParsedRepo {
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new ParseError("GitHub URL should look like github.com/{owner}/{repo}.");
  }
  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/, "");
  if (!/^[\w.-]+$/.test(owner) || !/^[\w.-]+$/.test(repo)) {
    throw new ParseError("Owner / repo names contain unexpected characters.");
  }
  // segments[2] is "tree" / "blob" / "commit" / "pull"
  let ref: string | undefined;
  if (segments[2] === "tree" || segments[2] === "blob" || segments[2] === "commit") {
    ref = segments[3];
  }
  return { kind: "repo", host: "github.com", owner, repo, ref };
}

function parseCompactRef(s: string): ParsedAgent | null {
  // "ethereum:9382" or "base/1380"
  const m = s.match(/^([a-z]+)[:/](\d+)$/i);
  if (!m) return null;
  const chain = m[1].toLowerCase();
  if (!isSupportedSlug(chain)) return null;
  return { kind: "agent", chain, tokenId: BigInt(m[2]) };
}

function parseRepoShorthand(s: string): ParsedRepo | null {
  // "owner/repo" but not "chain/123" (already caught above)
  const m = s.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
  if (!m) return null;
  if (/^\d+$/.test(m[2])) return null; // "ethereum/9382" already handled
  return { kind: "repo", host: "github.com", owner: m[1], repo: m[2] };
}

export class ParseError extends Error {
  readonly code = "PARSE_ERROR";
}
