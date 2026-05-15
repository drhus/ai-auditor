export function NutritionalFactsPanel({
  agentLabel = "github.com/example/agent @ abc1234",
  auditedAt = "2026-05-15",
  auditId = "aud_01J9XYZ",
  overall = 2.8,
  euAiAct = 2.6,
  nistRmf = 3.0,
}: {
  agentLabel?: string;
  auditedAt?: string;
  auditId?: string;
  overall?: number;
  euAiAct?: number;
  nistRmf?: number;
}) {
  return (
    <div className="rounded-lg border-2 border-ink-900 bg-white p-5 font-mono text-xs leading-tight text-ink-900 shadow-[6px_6px_0_0_var(--color-ink-900)]">
      <p className="mb-1 font-serif text-base font-bold uppercase tracking-wide">
        AI Agent Audit Facts
      </p>
      <p className="text-[10px] text-ink-600">{agentLabel}</p>
      <p className="mb-3 text-[10px] text-ink-600">
        Audited {auditedAt} · {auditId}
      </p>
      <hr className="border-ink-900" />
      <Row label="Risk classification">
        <span className="rounded bg-[var(--color-fail)] px-1.5 py-0.5 text-ink-50">
          HIGH-RISK
        </span>
      </Row>
      <p className="mb-2 text-[10px] text-ink-600">
        Annex III §1(a) biometric (auto-detected)
      </p>
      <hr className="border-ink-900" />
      <Row label="Overall score" strong>
        {overall.toFixed(1)} / 4.0
      </Row>
      <hr className="my-2 border-ink-200" />
      <Row label="EU AI Act" strong>
        {euAiAct.toFixed(1)} / 4.0
      </Row>
      <ClauseRow label="Art. 12 Logging" score={3.0} />
      <ClauseRow label="Art. 14 Oversight" score={2.0} />
      <ClauseRow label="Art. 15 Robustness" score={3.5} />
      <ClauseRow label="Art. 50 Transparency" score={2.0} />
      <hr className="my-2 border-ink-200" />
      <Row label="NIST AI RMF 1.0" strong>
        {nistRmf.toFixed(1)} / 4.0
      </Row>
      <ClauseRow label="GOVERN" score={2.0} />
      <ClauseRow label="MEASURE" score={3.8} />
      <ClauseRow label="MANAGE" score={3.2} />
      <hr className="my-2 border-ink-900" />
      <Row label="External controls">5 unconfirmed</Row>
      <Row label="Code controls">22 / 22 covered</Row>
      <hr className="my-2 border-ink-900" />
      <p className="text-[10px] text-ink-600">
        Anchored on Sepolia · EAS UID 0xabc…d3f
        <br />
        Bundle 0x7c9…a12 · Checker v0.3.2 · Regs 2024-08
      </p>
    </div>
  );
}

function Row({
  label,
  strong,
  children,
}: {
  label: string;
  strong?: boolean;
  children: React.ReactNode;
}) {
  return (
    <p
      className={`flex items-center justify-between py-0.5 ${
        strong ? "font-bold" : ""
      }`}
    >
      <span>{label}</span>
      <span>{children}</span>
    </p>
  );
}

function ClauseRow({ label, score }: { label: string; score: number }) {
  const filled = Math.round((score / 4) * 4);
  const dots = "●".repeat(filled) + "○".repeat(4 - filled);
  return (
    <p className="flex items-center justify-between pl-3 text-[11px]">
      <span className="text-ink-600">{label}</span>
      <span>
        <span className="mr-2 text-ink-900">{dots}</span>
        {score.toFixed(1)}
      </span>
    </p>
  );
}
