import { createPublicClient, http, type Address } from "viem";
import { CHAINS, type SupportedSlug } from "./chains";

// Minimal ABI for ERC-721 + ERC-8004 reads we need to resolve an agent.
const REGISTRY_ABI = [
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getAgentWallet",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

export interface AgentRegistration {
  agentId: string;
  chain: SupportedSlug;
  chainId: number;
  registryAddress: Address;
  tokenURI: string;
  owner: Address | null;
  wallet: Address | null;
  metadata: AgentMetadata | null;
  repoUrl: string | null;
  fetchedAt: string;
}

export interface AgentMetadata {
  type?: string;
  name?: string;
  description?: string;
  image?: string;
  services?: AgentService[];
  registrations?: unknown[];
  raw: unknown;
}

export interface AgentService {
  role?: string;
  endpoint?: string;
  url?: string;
  [k: string]: unknown;
}

export async function resolveAgent(
  chain: SupportedSlug,
  tokenId: bigint,
): Promise<AgentRegistration> {
  const cfg = CHAINS[chain];
  const client = createPublicClient({
    chain: cfg.chain,
    transport: http(cfg.rpcUrl),
  });

  const tokenURI = await client.readContract({
    address: cfg.identityRegistry,
    abi: REGISTRY_ABI,
    functionName: "tokenURI",
    args: [tokenId],
  });

  const [owner, wallet] = await Promise.all([
    safeRead(() =>
      client.readContract({
        address: cfg.identityRegistry,
        abi: REGISTRY_ABI,
        functionName: "ownerOf",
        args: [tokenId],
      }),
    ),
    safeRead(() =>
      client.readContract({
        address: cfg.identityRegistry,
        abi: REGISTRY_ABI,
        functionName: "getAgentWallet",
        args: [tokenId],
      }),
    ),
  ]);

  const metadata = await fetchMetadata(tokenURI);
  const repoUrl = metadata ? extractRepoUrl(metadata) : null;

  return {
    agentId: tokenId.toString(),
    chain,
    chainId: cfg.chain.id,
    registryAddress: cfg.identityRegistry,
    tokenURI,
    owner: (owner as Address | null) ?? null,
    wallet: (wallet as Address | null) ?? null,
    metadata,
    repoUrl,
    fetchedAt: new Date().toISOString(),
  };
}

async function safeRead<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

async function fetchMetadata(uri: string): Promise<AgentMetadata | null> {
  const url = normaliseUri(uri);
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const raw = await res.json();
    return {
      type: typeof raw?.type === "string" ? raw.type : undefined,
      name: typeof raw?.name === "string" ? raw.name : undefined,
      description: typeof raw?.description === "string" ? raw.description : undefined,
      image: typeof raw?.image === "string" ? raw.image : undefined,
      services: Array.isArray(raw?.services) ? raw.services : undefined,
      registrations: Array.isArray(raw?.registrations) ? raw.registrations : undefined,
      raw,
    };
  } catch {
    return null;
  }
}

function normaliseUri(uri: string): string | null {
  if (!uri) return null;
  if (uri.startsWith("ipfs://")) {
    return `https://ipfs.io/ipfs/${uri.slice("ipfs://".length)}`;
  }
  if (uri.startsWith("ar://")) {
    return `https://arweave.net/${uri.slice("ar://".length)}`;
  }
  if (uri.startsWith("data:")) {
    return uri;
  }
  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }
  return null;
}

const REPO_ROLES = new Set(["source", "repository", "repo", "code", "github"]);

export function extractRepoUrl(meta: AgentMetadata): string | null {
  if (meta.services) {
    for (const svc of meta.services) {
      const endpoint = svc?.endpoint ?? svc?.url;
      if (typeof endpoint !== "string") continue;
      if (svc?.role && typeof svc.role === "string" && REPO_ROLES.has(svc.role.toLowerCase())) {
        if (isRepoUrl(endpoint)) return endpoint;
      }
    }
  }
  const raw = meta.raw as Record<string, unknown> | null;
  if (raw && typeof raw === "object") {
    for (const key of ["repository", "source", "github", "repo"]) {
      const v = raw[key];
      if (typeof v === "string" && isRepoUrl(v)) return v;
    }
  }
  const serialised = JSON.stringify(meta.raw ?? {});
  const m = serialised.match(/https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/);
  return m ? m[0] : null;
}

function isRepoUrl(s: string): boolean {
  return /^https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\//i.test(s);
}
