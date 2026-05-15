// Simple homebrew i18n. Two locales: en (default) + zh (Simplified Chinese).
// Cookie-based selection. Server-only — pass translated strings as props
// to client components.
//
// Note: the brand "8RR8" stays untranslated. Article numbers and chain
// names too (Article 12, Sepolia, etc).

export type Locale = "en" | "zh";

export const LOCALES: Locale[] = ["en", "zh"];

export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

type Dict = Record<string, string>;

const EN: Dict = {
  // Nav
  "nav.about": "About",
  "nav.docs": "Docs",
  "nav.audits": "Audits",
  "nav.github": "GitHub",
  "nav.new_audit": "← New audit",
  "nav.audit_agent": "← Audit an agent",

  // Landing — hero
  "landing.eyebrow": "For ERC-8004 registered agents · Sepolia testnet · V0",
  "landing.hero.line1": "The Verified Fact Stamp",
  "landing.hero.line2": "about your agent.",
  "landing.hero.subhead": "Compliance and regulation conformity — anchored on chain.",
  "landing.hero.description":
    "Paste your ERC-8004 agent — or a plain GitHub repo. Get a verifiable EU AI Act score in minutes, anchored on chain in the canonical ERC-8004 Validation Registry, recognisable across markets. Every finding cited file-and-line in your code.",
  "landing.hero.placeholder":
    "https://8004scan.io/agents/ethereum/9382  ·  github.com/owner/repo  ·  owner/repo",
  "landing.hero.submit": "Audit my agent",
  "landing.hero.submitting": "Resolving…",
  "landing.hero.examples":
    "Examples: 8004scan agent URL, github.com URL, or shorthand like base:1380 / owner/repo.",

  // Landing — steps
  "landing.steps.01.title": "Connect",
  "landing.steps.01.body":
    "Paste any ERC-8004 agent URL. We resolve the registered repository through the on-chain Identity Registry.",
  "landing.steps.02.title": "Audit",
  "landing.steps.02.body":
    "A multi-stage pipeline reads your code against the EU AI Act and NIST AI RMF. Every finding is anchored to a file and line.",
  "landing.steps.03.title": "Verify",
  "landing.steps.03.body":
    "Your score lands on chain as a packed event plus a canonical ERC-8004 validation response. Anyone can independently verify.",

  // Landing — why now
  "landing.why.title": "AI is global. Regulation is local.",
  "landing.why.lead":
    "Excellent AI agents are being built everywhere — but compliance isn't transferable. A team shipping a stellar agent into a new market spends months and tens of thousands of euros proving it complies with rules it was never designed against. 8RR8 turns that into 60 seconds of on-chain attestation any buyer, anywhere, can independently verify.",
  "landing.why.eu":
    "The EU AI Act becomes fully applicable on 2 August 2026 — high-risk conformity assessment, CE marking, Article 50 transparency obligations all in force. Penalties reach €35M or 7% of global turnover.",
  "landing.why.8004":
    "ERC-8004 went live on Ethereum mainnet on 29 January 2026. 200,000+ AI agents are registered. None of them yet have a standard verifiable record of compliance. 8RR8 is that record.",

  // Landing — footer
  "landing.footer.copyright": "© 8RR8 · open source on GitHub",
  "landing.footer.version": "v0.1.0 · Sepolia testnet",

  // About
  "about.title": "The Verified Fact Stamp about your agent.",
  "about.subhead": "Compliance and regulation conformity — anchored on chain.",
  "about.global":
    "AI is global. Regulation is local. World-class AI agents are being built in many markets — but compliance is not transferable. A team that built a stellar agent in one jurisdiction has to spend months and tens of thousands of euros proving it complies with the rules of every other jurisdiction they want to sell into. That gap is killing cross-border AI commerce.",
  "about.eu":
    "The EU AI Act becomes fully applicable on 2 August 2026 with high-risk conformity assessment, CE marking, and Article 50 transparency obligations all in force. Penalties for prohibited-practice violations reach €35M or 7% of global turnover. Manual audits cost €25k–€150k and take weeks.",
  "about.8004":
    "In parallel, ERC-8004 — Ethereum's standard for trustless AI agents — went live on mainnet on 29 January 2026. Two hundred thousand agents are already registered. None of them yet have a standard verifiable record of compliance.",
  "about.product":
    "8RR8 is that record. Paste an ERC-8004 agent URL, we resolve the registered repository, run a multi-stage audit pipeline against the EU AI Act and NIST AI RMF, and publish a per-clause score on chain. Every finding cites a file and line in the audited code.",
  "about.pipeline":
    "The audit pipeline is multi-stage. RECON discovers your agent's framework, model usage, and data signals. MAP determines whether you fall under high-risk classification. CHECK runs deterministic and LLM-judge probes against each in-scope clause. VERIFY confirms findings with a second pass. GRADE scores. REPORT anchors on chain.",
  "about.v1":
    "V1 runs on Sepolia and audits ERC-8004-registered agents — plus any GitHub repo as a direct path. Each audit emits one packed AuditScored event from our open-source contract plus a canonical validationResponse on the ERC-8004 Validation Registry — so audits show up in standard 8004 discovery queries.",
  "about.open_source":
    "Everything is open source on GitHub. The regulations are public; what compounds is the checker library — an evolving open-source canonical implementation that anyone can re-run against the same commit to independently verify our verdicts.",
  "about.footer": "This is V0 — an early scaffold. The full audit pipeline is in active build.",

  // Common
  "lang.label": "Language",
};

const ZH: Dict = {
  // Nav
  "nav.about": "关于",
  "nav.docs": "文档",
  "nav.audits": "审计记录",
  "nav.github": "GitHub",
  "nav.new_audit": "← 新审计",
  "nav.audit_agent": "← 审计代理",

  // Landing — hero
  "landing.eyebrow": "面向 ERC-8004 注册代理 · Sepolia 测试网 · V0 版本",
  "landing.hero.line1": "为您的代理颁发",
  "landing.hero.line2": "可验证事实印章。",
  "landing.hero.subhead": "合规与监管一致性 — 链上锚定。",
  "landing.hero.description":
    "粘贴您的 ERC-8004 代理或 GitHub 仓库链接,几分钟内获得可验证的欧盟 AI 法案合规评分。锚定在 ERC-8004 验证登记表上,全球市场可查。每一项发现都精确指向代码中的文件与行号。",
  "landing.hero.placeholder":
    "https://8004scan.io/agents/ethereum/9382  ·  github.com/用户/仓库  ·  用户/仓库",
  "landing.hero.submit": "审计我的代理",
  "landing.hero.submitting": "解析中…",
  "landing.hero.examples":
    "示例:8004scan 代理 URL、github.com URL,或简写如 base:1380 / 用户/仓库。",

  // Landing — steps
  "landing.steps.01.title": "连接",
  "landing.steps.01.body":
    "粘贴任何 ERC-8004 代理 URL。我们通过链上身份登记表自动解析其代码仓库。",
  "landing.steps.02.title": "审计",
  "landing.steps.02.body":
    "多阶段流水线根据欧盟 AI 法案和 NIST AI RMF 审计您的代码。每条发现都锚定到具体文件和行号。",
  "landing.steps.03.title": "验证",
  "landing.steps.03.body":
    "您的评分以紧凑事件 + 规范的 ERC-8004 验证响应形式上链,任何人都可独立核验。",

  // Landing — why now
  "landing.why.title": "AI 全球化,监管在地化。",
  "landing.why.lead":
    "世界各地都在构建优秀的 AI 代理 — 但合规性不可迁移。一支团队将卓越代理推向新市场时,要花数月时间和数万欧元来证明其符合当地法规。8RR8 把这件事压缩为 60 秒 — 一次链上证明,全球买家随时可验证。",
  "landing.why.eu":
    "欧盟 AI 法案将于 2026 年 8 月 2 日全面适用 — 高风险合规评估、CE 标识、第 50 条透明度义务全部生效。违规罚款最高可达 3500 万欧元或全球营业额的 7%。",
  "landing.why.8004":
    "ERC-8004 于 2026 年 1 月 29 日在以太坊主网上线。已注册的 AI 代理超过 200,000 个,但目前没有任何代理拥有标准化、可验证的合规记录。8RR8 就是那个记录。",

  // Landing — footer
  "landing.footer.copyright": "© 8RR8 · GitHub 开源",
  "landing.footer.version": "v0.1.0 · Sepolia 测试网",

  // About
  "about.title": "为您的代理颁发可验证事实印章。",
  "about.subhead": "合规与监管一致性 — 链上锚定。",
  "about.global":
    "AI 是全球的,监管是在地的。世界各地都在构建一流的 AI 代理 — 但合规性不可迁移。在一个司法辖区构建优秀代理的团队,要花费数月时间和数万欧元才能证明其符合其他每个想要进入市场的法规。这种差距正在扼杀跨境 AI 商务。",
  "about.eu":
    "欧盟 AI 法案将于 2026 年 8 月 2 日全面适用 — 高风险合规评估、CE 标识及第 50 条透明度义务全部生效。违反禁止性条款的罚款高达 3500 万欧元或全球营业额的 7%。手动审计费用 2.5 万至 15 万欧元,耗时数周。",
  "about.8004":
    "与此同时,ERC-8004 — 以太坊的可信无中介代理标准 — 于 2026 年 1 月 29 日在主网上线。已有二十万个代理完成注册。但目前没有任何代理拥有标准化、可验证的合规记录。",
  "about.product":
    "8RR8 就是那个记录。粘贴 ERC-8004 代理 URL,我们解析其注册仓库,运行多阶段审计流水线,依据欧盟 AI 法案和 NIST AI RMF 评分,逐条上链发布。每条发现都精确引用被审代码的文件和行号。",
  "about.pipeline":
    "审计流水线分为多个阶段。RECON 探测您代理的框架、模型使用和数据信号;MAP 判定是否属于高风险分类;CHECK 对每个适用条款运行确定性规则 + LLM 评审探针;VERIFY 二次确认结果;GRADE 评分;REPORT 上链锚定。",
  "about.v1":
    "V1 版本运行于 Sepolia 测试网,审计 ERC-8004 已注册的代理 — 以及任意 GitHub 仓库作为直接路径。每次审计从开源合约发出一个紧凑的 AuditScored 事件,并向规范的 ERC-8004 验证登记表发布一次 validationResponse — 因此审计可在标准 8004 检索中被发现。",
  "about.open_source":
    "全部开源,代码在 GitHub。法规是公开的;真正在沉淀的是检查器库 — 一个不断演进的开源参考实现。任何人都可以针对相同的代码提交重跑流水线,独立验证我们的判断。",
  "about.footer": "这是 V0 版本 — 早期脚手架。完整审计流水线正在积极构建中。",

  // Common
  "lang.label": "语言",
};

const DICTS: Record<Locale, Dict> = { en: EN, zh: ZH };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? EN;
}

export function tFor(locale: Locale): (key: string) => string {
  const dict = getDict(locale);
  return (key: string) => dict[key] ?? EN[key] ?? key;
}
