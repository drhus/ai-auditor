import { isSupportedSlug, type SupportedSlug } from "./chains";

export interface ParsedAgent {
  chain: SupportedSlug;
  tokenId: bigint;
}

const SCAN_HOSTS = new Set(["8004scan.io", "www.8004scan.io"]);

export function parseAgentInput(input: string): ParsedAgent {
  const trimmed = input.trim();

  if (/^https?:\/\//i.test(trimmed)) {
    return parseAgentUrl(trimmed);
  }

  const compact = parseCompactRef(trimmed);
  if (compact) return compact;

  throw new ParseError(
    "Paste an 8004scan.io URL (e.g. https://8004scan.io/agents/ethereum/9382) or a chain:tokenId reference.",
  );
}

function parseAgentUrl(raw: string): ParsedAgent {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new ParseError("Not a valid URL.");
  }

  if (!SCAN_HOSTS.has(url.hostname)) {
    throw new ParseError(
      `Unsupported host "${url.hostname}". V0 supports 8004scan.io URLs.`,
    );
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 3 || segments[0] !== "agents") {
    throw new ParseError(
      "URL should look like /agents/{chain}/{tokenId}.",
    );
  }

  const chainSlug = segments[1].toLowerCase();
  if (!isSupportedSlug(chainSlug)) {
    throw new ParseError(`Unsupported chain "${chainSlug}".`);
  }

  const tokenIdStr = segments[2];
  if (!/^\d+$/.test(tokenIdStr)) {
    throw new ParseError(`Token ID "${tokenIdStr}" must be a positive integer.`);
  }

  return { chain: chainSlug, tokenId: BigInt(tokenIdStr) };
}

function parseCompactRef(s: string): ParsedAgent | null {
  // Accepts forms like "ethereum:9382" or "base/1380"
  const m = s.match(/^([a-z]+)[:/](\d+)$/i);
  if (!m) return null;
  const chain = m[1].toLowerCase();
  if (!isSupportedSlug(chain)) return null;
  return { chain, tokenId: BigInt(m[2]) };
}

export class ParseError extends Error {
  readonly code = "PARSE_ERROR";
}
