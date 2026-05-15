import { mainnet, base, optimism, sepolia } from "viem/chains";
import type { Chain } from "viem";

export type SupportedSlug = "ethereum" | "base" | "optimism" | "sepolia";

export interface ChainConfig {
  slug: SupportedSlug;
  chain: Chain;
  rpcUrl: string;
  identityRegistry: `0x${string}`;
}

function env(key: string): string {
  const v = process.env[key];
  if (!v) {
    throw new Error(`Missing env: ${key}`);
  }
  return v;
}

function envAddr(key: string): `0x${string}` {
  const v = env(key);
  if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
    throw new Error(`Env ${key} is not a 20-byte address`);
  }
  return v as `0x${string}`;
}

export const CHAINS: Record<SupportedSlug, ChainConfig> = {
  ethereum: {
    slug: "ethereum",
    chain: mainnet,
    rpcUrl: process.env.RPC_ETHEREUM ?? "https://eth.merkle.io",
    identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_ETHEREUM"),
  },
  base: {
    slug: "base",
    chain: base,
    rpcUrl: process.env.RPC_BASE ?? "https://mainnet.base.org",
    identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_BASE"),
  },
  optimism: {
    slug: "optimism",
    chain: optimism,
    rpcUrl: process.env.RPC_OPTIMISM ?? "https://mainnet.optimism.io",
    identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_OPTIMISM"),
  },
  sepolia: {
    slug: "sepolia",
    chain: sepolia,
    rpcUrl: process.env.RPC_SEPOLIA ?? "https://ethereum-sepolia-rpc.publicnode.com",
    identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_SEPOLIA"),
  },
};

export function isSupportedSlug(s: string): s is SupportedSlug {
  return s === "ethereum" || s === "base" || s === "optimism" || s === "sepolia";
}
