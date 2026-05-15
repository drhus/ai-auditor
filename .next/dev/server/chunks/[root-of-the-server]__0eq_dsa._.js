module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/chains.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CHAINS",
    ()=>CHAINS,
    "isSupportedSlug",
    ()=>isSupportedSlug
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$mainnet$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/chains/definitions/mainnet.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$base$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/chains/definitions/base.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$optimism$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/chains/definitions/optimism.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$sepolia$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/chains/definitions/sepolia.js [app-route] (ecmascript)");
;
function env(key) {
    const v = process.env[key];
    if (!v) {
        throw new Error(`Missing env: ${key}`);
    }
    return v;
}
function envAddr(key) {
    const v = env(key);
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) {
        throw new Error(`Env ${key} is not a 20-byte address`);
    }
    return v;
}
const CHAINS = {
    ethereum: {
        slug: "ethereum",
        chain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$mainnet$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mainnet"],
        rpcUrl: process.env.RPC_ETHEREUM ?? "https://eth.merkle.io",
        identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_ETHEREUM")
    },
    base: {
        slug: "base",
        chain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$base$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["base"],
        rpcUrl: process.env.RPC_BASE ?? "https://mainnet.base.org",
        identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_BASE")
    },
    optimism: {
        slug: "optimism",
        chain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$optimism$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["optimism"],
        rpcUrl: process.env.RPC_OPTIMISM ?? "https://mainnet.optimism.io",
        identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_OPTIMISM")
    },
    sepolia: {
        slug: "sepolia",
        chain: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$chains$2f$definitions$2f$sepolia$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["sepolia"],
        rpcUrl: process.env.RPC_SEPOLIA ?? "https://ethereum-sepolia-rpc.publicnode.com",
        identityRegistry: envAddr("ERC8004_IDENTITY_REGISTRY_SEPOLIA")
    }
};
function isSupportedSlug(s) {
    return s === "ethereum" || s === "base" || s === "optimism" || s === "sepolia";
}
}),
"[project]/src/lib/parse-url.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ParseError",
    ()=>ParseError,
    "parseAgentInput",
    ()=>parseAgentInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chains$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/chains.ts [app-route] (ecmascript)");
;
const SCAN_HOSTS = new Set([
    "8004scan.io",
    "www.8004scan.io"
]);
const GITHUB_HOSTS = new Set([
    "github.com",
    "www.github.com"
]);
function parseAgentInput(input) {
    const trimmed = input.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return parseUrl(trimmed);
    }
    const compact = parseCompactRef(trimmed);
    if (compact) return compact;
    const shorthand = parseRepoShorthand(trimmed);
    if (shorthand) return shorthand;
    throw new ParseError("Paste an 8004scan.io URL, a GitHub repo URL, or a chain:tokenId / owner/repo reference.");
}
function parseUrl(raw) {
    let url;
    try {
        url = new URL(raw);
    } catch  {
        throw new ParseError("Not a valid URL.");
    }
    if (SCAN_HOSTS.has(url.hostname)) {
        return parseScanPath(url);
    }
    if (GITHUB_HOSTS.has(url.hostname)) {
        return parseGithubPath(url);
    }
    throw new ParseError(`Unsupported host "${url.hostname}". Use an 8004scan.io URL or a github.com URL.`);
}
function parseScanPath(url) {
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length < 3 || segments[0] !== "agents") {
        throw new ParseError("URL should look like /agents/{chain}/{tokenId}.");
    }
    const chainSlug = segments[1].toLowerCase();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chains$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupportedSlug"])(chainSlug)) {
        throw new ParseError(`Unsupported chain "${chainSlug}".`);
    }
    const tokenIdStr = segments[2];
    if (!/^\d+$/.test(tokenIdStr)) {
        throw new ParseError(`Token ID "${tokenIdStr}" must be a positive integer.`);
    }
    return {
        kind: "agent",
        chain: chainSlug,
        tokenId: BigInt(tokenIdStr)
    };
}
function parseGithubPath(url) {
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
    let ref;
    if (segments[2] === "tree" || segments[2] === "blob" || segments[2] === "commit") {
        ref = segments[3];
    }
    return {
        kind: "repo",
        host: "github.com",
        owner,
        repo,
        ref
    };
}
function parseCompactRef(s) {
    // "ethereum:9382" or "base/1380"
    const m = s.match(/^([a-z]+)[:/](\d+)$/i);
    if (!m) return null;
    const chain = m[1].toLowerCase();
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chains$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSupportedSlug"])(chain)) return null;
    return {
        kind: "agent",
        chain,
        tokenId: BigInt(m[2])
    };
}
function parseRepoShorthand(s) {
    // "owner/repo" but not "chain/123" (already caught above)
    const m = s.match(/^([\w.-]+)\/([\w.-]+?)(?:\.git)?$/);
    if (!m) return null;
    if (/^\d+$/.test(m[2])) return null; // "ethereum/9382" already handled
    return {
        kind: "repo",
        host: "github.com",
        owner: m[1],
        repo: m[2]
    };
}
class ParseError extends Error {
    code = "PARSE_ERROR";
}
}),
"[project]/src/lib/erc8004.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractRepoUrl",
    ()=>extractRepoUrl,
    "resolveAgent",
    ()=>resolveAgent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$createPublicClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/clients/createPublicClient.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$http$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/viem/_esm/clients/transports/http.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chains$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/chains.ts [app-route] (ecmascript)");
;
;
// Minimal ABI for ERC-721 + ERC-8004 reads we need to resolve an agent.
const REGISTRY_ABI = [
    {
        type: "function",
        name: "tokenURI",
        stateMutability: "view",
        inputs: [
            {
                name: "tokenId",
                type: "uint256"
            }
        ],
        outputs: [
            {
                name: "",
                type: "string"
            }
        ]
    },
    {
        type: "function",
        name: "ownerOf",
        stateMutability: "view",
        inputs: [
            {
                name: "tokenId",
                type: "uint256"
            }
        ],
        outputs: [
            {
                name: "",
                type: "address"
            }
        ]
    },
    {
        type: "function",
        name: "getAgentWallet",
        stateMutability: "view",
        inputs: [
            {
                name: "agentId",
                type: "uint256"
            }
        ],
        outputs: [
            {
                name: "",
                type: "address"
            }
        ]
    }
];
async function resolveAgent(chain, tokenId) {
    const cfg = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$chains$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CHAINS"][chain];
    const client = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$createPublicClient$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createPublicClient"])({
        chain: cfg.chain,
        transport: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$viem$2f$_esm$2f$clients$2f$transports$2f$http$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["http"])(cfg.rpcUrl)
    });
    const tokenURI = await client.readContract({
        address: cfg.identityRegistry,
        abi: REGISTRY_ABI,
        functionName: "tokenURI",
        args: [
            tokenId
        ]
    });
    const [owner, wallet] = await Promise.all([
        safeRead(()=>client.readContract({
                address: cfg.identityRegistry,
                abi: REGISTRY_ABI,
                functionName: "ownerOf",
                args: [
                    tokenId
                ]
            })),
        safeRead(()=>client.readContract({
                address: cfg.identityRegistry,
                abi: REGISTRY_ABI,
                functionName: "getAgentWallet",
                args: [
                    tokenId
                ]
            }))
    ]);
    const metadata = await fetchMetadata(tokenURI);
    const repoUrl = metadata ? extractRepoUrl(metadata) : null;
    return {
        agentId: tokenId.toString(),
        chain,
        chainId: cfg.chain.id,
        registryAddress: cfg.identityRegistry,
        tokenURI,
        owner: owner ?? null,
        wallet: wallet ?? null,
        metadata,
        repoUrl,
        fetchedAt: new Date().toISOString()
    };
}
async function safeRead(fn) {
    try {
        return await fn();
    } catch  {
        return null;
    }
}
async function fetchMetadata(uri) {
    const url = normaliseUri(uri);
    if (!url) return null;
    try {
        const res = await fetch(url, {
            headers: {
                Accept: "application/json"
            },
            signal: AbortSignal.timeout(8000)
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
            raw
        };
    } catch  {
        return null;
    }
}
function normaliseUri(uri) {
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
const REPO_ROLES = new Set([
    "source",
    "repository",
    "repo",
    "code",
    "github"
]);
function extractRepoUrl(meta) {
    if (meta.services) {
        for (const svc of meta.services){
            const endpoint = svc?.endpoint ?? svc?.url;
            if (typeof endpoint !== "string") continue;
            if (svc?.role && typeof svc.role === "string" && REPO_ROLES.has(svc.role.toLowerCase())) {
                if (isRepoUrl(endpoint)) return endpoint;
            }
        }
    }
    const raw = meta.raw;
    if (raw && typeof raw === "object") {
        for (const key of [
            "repository",
            "source",
            "github",
            "repo"
        ]){
            const v = raw[key];
            if (typeof v === "string" && isRepoUrl(v)) return v;
        }
    }
    const serialised = JSON.stringify(meta.raw ?? {});
    const m = serialised.match(/https?:\/\/(?:www\.)?github\.com\/[\w.-]+\/[\w.-]+/);
    return m ? m[0] : null;
}
function isRepoUrl(s) {
    return /^https?:\/\/(?:www\.)?(?:github\.com|gitlab\.com|bitbucket\.org)\//i.test(s);
}
}),
"[project]/src/app/api/resolve/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$parse$2d$url$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/parse-url.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$erc8004$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/erc8004.ts [app-route] (ecmascript)");
;
;
;
const runtime = "nodejs";
const dynamic = "force-dynamic";
async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Body must be JSON."
        }, {
            status: 400
        });
    }
    const input = typeof body === "object" && body !== null && "input" in body ? body.input : null;
    if (typeof input !== "string") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Body must include `input` (string)."
        }, {
            status: 400
        });
    }
    let parsed;
    try {
        parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$parse$2d$url$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseAgentInput"])(input);
    } catch (e) {
        if (e instanceof __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$parse$2d$url$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ParseError"]) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: e.message
            }, {
                status: 422
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Could not parse input."
        }, {
            status: 422
        });
    }
    if (parsed.kind === "repo") {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            kind: "repo",
            owner: parsed.owner,
            repo: parsed.repo,
            ref: parsed.ref ?? null,
            repoUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
            auditPath: `/r/${parsed.owner}/${parsed.repo}`
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
            }
        });
    }
    try {
        const agent = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$erc8004$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveAgent"])(parsed.chain, parsed.tokenId);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            kind: "agent",
            auditPath: `/a/${parsed.chain}/${parsed.tokenId}`,
            ...agent
        }, {
            headers: {
                "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600"
            }
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Resolution failed.";
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: message,
            hint: "The agent may not be registered on this chain, or the registry address is not yet configured."
        }, {
            status: 502
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0eq_dsa._.js.map