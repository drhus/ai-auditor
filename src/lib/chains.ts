import { mainnet, base, optimism, sepolia } from "viem/chains";
import type { Chain } from "viem";

export type SupportedSlug = "ethereum" | "base" | "optimism" | "sepolia";

export interface ChainConfig {
  slug: SupportedSlug;
  chain: Chain;
  rpcUrl: string;
  identityRegistry: `0x${string}`;
  reputationRegistry: `0x${string}`;
}

// Canonical ERC-8004 deployments (public knowledge).
// Source: https://github.com/erc-8004/erc-8004-contracts
const DEFAULT_REGISTRIES = {
  mainnetIdentity: "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
  mainnetReputation: "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  sepoliaIdentity: "0x8004A818BFB912233c491871b3d84c89A494BD9e",
  sepoliaReputation: "0x8004B663056A597Dffe9eCcC1965A193B7388713",
} as const;

const DEFAULT_RPCS = {
  ethereum: "https://eth.merkle.io",
  base: "https://mainnet.base.org",
  optimism: "https://mainnet.optimism.io",
  sepolia: "https://ethereum-sepolia-rpc.publicnode.com",
} as const;

function addrFromEnv(
  key: string,
  fallback: string,
): `0x${string}` {
  const v = process.env[key] ?? fallback;
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
    // Don't throw at import time — return the (valid) fallback. If a
    // misconfigured env var slipped through, log and use the canonical one.
    if (typeof console !== "undefined") {
      console.warn(`[chains] ${key} is not a valid address, using canonical fallback`);
    }
    return fallback as `0x${string}`;
  }
  return v as `0x${string}`;
}

// Build the config lazily so module import never throws even if env is
// incomplete. Top-level reads only resolve when getChainConfig is called.
let cached: Record<SupportedSlug, ChainConfig> | null = null;

function buildChains(): Record<SupportedSlug, ChainConfig> {
  return {
    ethereum: {
      slug: "ethereum",
      chain: mainnet,
      rpcUrl: process.env.RPC_ETHEREUM || DEFAULT_RPCS.ethereum,
      identityRegistry: addrFromEnv(
        "ERC8004_IDENTITY_REGISTRY_ETHEREUM",
        DEFAULT_REGISTRIES.mainnetIdentity,
      ),
      reputationRegistry: addrFromEnv(
        "ERC8004_REPUTATION_REGISTRY_ETHEREUM",
        DEFAULT_REGISTRIES.mainnetReputation,
      ),
    },
    base: {
      slug: "base",
      chain: base,
      rpcUrl: process.env.RPC_BASE || DEFAULT_RPCS.base,
      identityRegistry: addrFromEnv(
        "ERC8004_IDENTITY_REGISTRY_BASE",
        DEFAULT_REGISTRIES.mainnetIdentity,
      ),
      reputationRegistry: addrFromEnv(
        "ERC8004_REPUTATION_REGISTRY_BASE",
        DEFAULT_REGISTRIES.mainnetReputation,
      ),
    },
    optimism: {
      slug: "optimism",
      chain: optimism,
      rpcUrl: process.env.RPC_OPTIMISM || DEFAULT_RPCS.optimism,
      identityRegistry: addrFromEnv(
        "ERC8004_IDENTITY_REGISTRY_OPTIMISM",
        DEFAULT_REGISTRIES.mainnetIdentity,
      ),
      reputationRegistry: addrFromEnv(
        "ERC8004_REPUTATION_REGISTRY_OPTIMISM",
        DEFAULT_REGISTRIES.mainnetReputation,
      ),
    },
    sepolia: {
      slug: "sepolia",
      chain: sepolia,
      rpcUrl: process.env.RPC_SEPOLIA || DEFAULT_RPCS.sepolia,
      identityRegistry: addrFromEnv(
        "ERC8004_IDENTITY_REGISTRY_SEPOLIA",
        DEFAULT_REGISTRIES.sepoliaIdentity,
      ),
      reputationRegistry: addrFromEnv(
        "ERC8004_REPUTATION_REGISTRY_SEPOLIA",
        DEFAULT_REGISTRIES.sepoliaReputation,
      ),
    },
  };
}

export function getChainConfig(slug: SupportedSlug): ChainConfig {
  if (!cached) cached = buildChains();
  return cached[slug];
}

// Backwards-compat: existing call sites read `CHAINS[slug]`. Use a Proxy so
// access is lazy without changing the call-site shape.
export const CHAINS: Record<SupportedSlug, ChainConfig> = new Proxy(
  {} as Record<SupportedSlug, ChainConfig>,
  {
    get(_t, prop: string) {
      if (prop === "ethereum" || prop === "base" || prop === "optimism" || prop === "sepolia") {
        return getChainConfig(prop);
      }
      return undefined;
    },
  },
);

export function isSupportedSlug(s: string): s is SupportedSlug {
  return s === "ethereum" || s === "base" || s === "optimism" || s === "sepolia";
}
