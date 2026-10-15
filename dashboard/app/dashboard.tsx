import React from "react";

type Result = "resellable" | "recycle" | "disposal";
type Decision = "awaiting" | "bin-a" | "bin-b" | "bin-c";

const NAV = ["Overview", "Diagnostics", "Inventory", "Sorting", "Safety alerts", "Reports"];

const KPIS = [
  { label: "Tested today", value: "48", sub: "42 routed, 6 awaiting verification", variant: "hero" },
  { label: "Awaiting verification", value: "6", sub: "Diagnosed, not yet routed", variant: "" },
  { label: "Resellable / Refurbishable", value: "27", sub: "56% of devices tested today", variant: "" },
  { label: "Safety alerts", value: "2", sub: "Needs immediate review", variant: "danger" },
];

const READINGS = [
  { label: "Battery ESR", value: "142", unit: "mΩ", pct: 57, limit: "Limit 250 mΩ", status: "Within limit", tone: "ok" },
  { label: "Power draw", value: "640", unit: "mA", pct: 80, limit: "Range 500 to 800 mA", status: "In range", tone: "ok" },
  { label: "Temperature rise", value: "11.8", unit: "°C", pct: 79, limit: "Limit 15 °C", status: "Near limit", tone: "warn" },
  { label: "Casing swell", value: "0.6", unit: "mm", pct: 30, limit: "Limit 2.0 mm", status: "Within limit", tone: "ok" },
];

const STEPS = [
  { label: "Scan", done: true },
  { label: "Electrical check", done: true },
  { label: "Grade", done: true },
  { label: "Sort: awaiting verification", done: false },
  { label: "Report", done: false },
];

const SUMMARY = [
  { key: "resellable" as Result, label: "Resellable / Refurbishable", value: 27, note: "56% of devices, Bin A", pct: 56 },
  { key: "recycle" as Result, label: "Recycle / Safe Dismantling", value: 15, note: "31% of devices, Bin B", pct: 31 },
  { key: "disposal" as Result, label: "Disposal", value: 6, note: "13% of devices, Bin C", pct: 13 },
];

const TABS = ["All devices", "Resellable", "Recycle", "Disposal", "Needs verification"];

const ROWS: {
  id: string; time: string; esr: string; power: string; temp: string; swell: string;
  result: Result; decision: Decision; alert?: boolean;
}[] = [
  { id: "REG-20261013-007", time: "14:32", esr: "142 mΩ", power: "640 mA", temp: "11.8 °C", swell: "0.6 mm", result: "resellable", decision: "awaiting" },
  { id: "REG-20261013-006", time: "14:21", esr: "390 mΩ", power: "1,240 mA", temp: "18.4 °C", swell: "3.9 mm", result: "disposal", decision: "bin-c" },
  { id: "REG-20261013-005", time: "14:09", esr: "—", power: "12 mA", temp: "1.1 °C", swell: "2.4 mm", result: "recycle", decision: "bin-b" },
  { id: "REG-20261013-004", time: "13:57", esr: "412 mΩ", power: "980 mA", temp: "16.2 °C", swell: "4.1 mm", result: "disposal", decision: "awaiting", alert: true },
  { id: "REG-20261013-003", time: "13:44", esr: "118 mΩ", power: "710 mA", temp: "8.3 °C", swell: "0.3 mm", result: "resellable", decision: "bin-a" },
];

const RESULT_LABEL: Record<Result, string> = {
  resellable: "Resellable / Refurbishable",
  recycle: "Recycle / Safe Dismantling",
  disposal: "Disposal",
};
const RESULT_CLASS: Record<Result, string> = {
  resellable: "green",
  recycle: "blue",
  disposal: "red",
};
const DECISION_LABEL: Record<Exclude<Decision, "awaiting">, string> = {
  "bin-a": "Verified, Bin A",
  "bin-b": "Verified, Bin B",
  "bin-c": "Verified, Bin C",
};

/* ---------- Small pieces ---------- */

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const Clock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const Warn = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3.5L2.5 20h19L12 3.5z" /><path d="M12 10v4.5M12 17.2v.1" />
  </svg>
);
const Pill = ({ tone, children }: { tone: string; children: React.ReactNode }) => (
  <span className={`pill ${tone}`}><i className="dot" />{children}</span>
);

/* ---------- Page ---------- */

export default function DiagnosticsOverview() {
  return (
    <div className="rg">
      <style>{CSS}</style>

      {/* Nav */}
      <header className="nav">
        <div className="brand">
          <span className="logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" />
              <rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" />
            </svg>
          </span>
          ReGrade
        </div>
        <nav className="navpill">
          {NAV.map((n, i) => (
            <a key={n} className={i === 0 ? "active" : ""} href="#">
              {n}{n === "Safety alerts" && <b className="badge">2</b>}
            </a>
          ))}
        </nav>
        <div className="navright">
          <button className="iconbtn" aria-label="Notifications">🔔</button>
          <button className="iconbtn" aria-label="Settings">⚙</button>
          <span className="avatar">OP</span>
        </div>
      </header>

      {/* Title */}
      <div className="titlebar">
        <div>
          <h1>Diagnostics overview</h1>
          <p className="muted">Sample recycling center, Tuesday 13 Oct 2026</p>
        </div>
        <div className="actions">
          <span className="tag">Sample data</span>
          <button className="btn">Export report</button>
          <button className="btn primary">＋ New diagnostic test</button>
        </div>
      </div>

      {/* Alert */}
      <section className="card alert">
        <span className="alert-icon"><Warn size={20} /></span>
        <div className="alert-body">
          <strong>Safety alert: battery swelling on REG-20261013-004</strong>
          <p className="muted">Wear gloves and move the device to the quarantine shelf. Do not charge it.</p>
        </div>
        <button className="btn">Review alert</button>
      </section>

      {/* KPIs */}
      <section className="kpis">
        {KPIS.map((k) => (
          <div key={k.label} className={`card kpi ${k.variant}`}>
            <span className="kpi-label">{k.label}</span>
            <span className="kpi-value">{k.value}</span>
            <span className="kpi-sub">{k.sub}</span>
          </div>
        ))}
      </section>

      {/* Middle grid */}
      <div className="grid">
        <div className="col">
          {/* Device detail */}
          <section className="card pad">
            <div className="row between">
              <div>
                <h3 className="mono-title">REG-20261013-007</h3>
                <p className="small muted">Smartphone, Model X12 (placeholder), 168 g nominal</p>
              </div>
              <span className="small muted row gap6"><Clock /> Test completed 14:32</span>
            </div>

            <div className="readings">
              {READINGS.map((r) => (
                <div key={r.label} className="reading">
                  <span className="rlabel">{r.label}</span>
                  <span className="rvalue">{r.value} <small>{r.unit}</small></span>
                  <div className="bar"><div className={`fill ${r.tone}`} style={{ width: `${r.pct}%` }} /></div>
                  <span className="small muted">{r.limit}</span>
                  <span className={`status ${r.tone}`}>
                    {r.tone === "ok" ? <Check /> : <Warn />} {r.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="steps">
              {STEPS.map((s) => (
                <span key={s.label} className={`step ${s.done ? "done" : ""}`}>
                  {s.done ? <Check /> : <Clock />} {s.label}
                </span>
              ))}
            </div>
          </section>

          {/* Classification */}
          <section className="card pad">
            <h3>Classification summary</h3>
            <p className="small muted">48 devices tested today. Diagnostic results, including those awaiting verification.</p>
            <div className="summary">
              {SUMMARY.map((s) => (
                <div key={s.key} className="sumcard">
                  <Pill tone={RESULT_CLASS[s.key]}>{s.label}</Pill>
                  <span className="sumvalue">{s.value}</span>
                  <span className="small muted">{s.note}</span>
                  <div className="sumbar"><div className={`fill ${RESULT_CLASS[s.key]}`} style={{ width: `${s.pct * 1.4}%` }} /></div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Decision */}
        <aside className="card pad decision">
          <h3>Decision</h3>
          <p className="small muted">
            The diagnostic result is a suggestion. The processing decision is final only after verification.
          </p>

          <div className="box white">
            <div className="row between">
              <strong>Diagnostic result</strong>
              <span className="tag">Automated</span>
            </div>
            <Pill tone="green">Resellable / Refurbishable</Pill>
            <p className="body">
              All readings are inside their limits. Temperature rise is close to the 15 °C limit, so check the
              casing before listing.
            </p>
          </div>

          <div className="box grey">
            <div className="row between">
              <strong>Processing decision</strong>
              <span className="small muted">Needs operator</span>
            </div>
            <Pill tone="amber">Awaiting verification</Pill>
            <p className="body">
              Not yet verified. Confirm the result to route this device to Bin A, or override it with a reason.
            </p>
            <div className="row gap8">
              <button className="btn primary">Verify and route</button>
              <button className="btn">Override</button>
            </div>
          </div>
        </aside>
      </div>

      {/* Audit log */}
      <section className="card pad">
        <h3>Audit log</h3>
        <p className="small muted">Newest first. Select a row to see the full readings for that device.</p>

        <div className="row between toolbar">
          <div className="tabs">
            {TABS.map((t, i) => (
              <button key={t} className={i === 0 ? "tab active" : "tab"}>{t}</button>
            ))}
          </div>
          <div className="row gap8">
            <div className="search">🔍 <input placeholder="Search device ID" /></div>
            <button className="btn">☰ Newest first</button>
          </div>
        </div>

        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                {["Device ID", "Brand", "Model", "Time", "ESR", "Power draw", "Temp rise", "Swell", "Diagnostic result", "Processing decision"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.id}>
                  <td className="id">
                    {r.alert && <span className="rowwarn"><Warn /></span>}
                    {r.id}
                  </td>
                  <td className="muted">Unknown</td>
                  <td className="muted">Unknown</td>
                  <td className="muted">{r.time}</td>
                  <td className="muted">{r.esr}</td>
                  <td className="muted">{r.power}</td>
                  <td className="muted">{r.temp}</td>
                  <td className="muted">{r.swell}</td>
                  <td><Pill tone={RESULT_CLASS[r.result]}>{RESULT_LABEL[r.result]}</Pill></td>
                  <td>
                    {r.decision === "awaiting" ? (
                      <Pill tone="amber">Awaiting verification</Pill>
                    ) : (
                      <span className="verified"><Check /> {DECISION_LABEL[r.decision]}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* ---------- Styles (swap for Tailwind / CSS modules later) ---------- */

const CSS = `
.rg{--bg:#e8eeea;--ink:#16302a;--muted:#5d6b66;--line:#e3e8e5;--green:#2f8a5f;--green-d:#1d6b47;
  --amber:#8a5a00;--red:#b42318;--blue:#2457a6;
  font-family:Inter,system-ui,sans-serif;background:var(--bg);color:var(--ink);
  min-height:100vh;padding:24px 32px 32px;box-sizing:border-box;max-width:1440px;margin:0 auto}
.rg *{box-sizing:border-box}
.rg h1{font-size:32px;margin:0;letter-spacing:-.02em}
.rg h3{font-size:17px;margin:0 0 4px}
.rg p{margin:4px 0 0}
.rg .muted{color:var(--muted)} .rg .small{font-size:12px}
.rg .row{display:flex;align-items:center}.rg .between{justify-content:space-between}
.rg .gap6{gap:6px}.rg .gap8{gap:8px}
.rg .card{background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(20,50,40,.08);transition:box-shadow .18s,transform .18s}
.rg .card:hover{box-shadow:0 6px 20px rgba(20,50,40,.13);transform:translateY(-2px)}
.rg .card.alert:hover{transform:none}
.rg .pad{padding:24px}
.rg .nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}
.rg .brand{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:600;color:var(--green-d)}
.rg .logo{width:36px;height:36px;border-radius:10px;background:#1d4a3a;display:grid;place-items:center}
.rg .navpill{display:flex;gap:4px;background:#fff;padding:5px;border-radius:999px}
.rg .navpill a{padding:10px 20px;border-radius:999px;font-size:14px;color:#33443e;text-decoration:none;display:flex;gap:6px;align-items:center;cursor:pointer;transition:background .15s,color .15s}
.rg .navpill a:hover{background:#f2f6f4}
.rg .navpill a.active{background:#173d31;color:#fff;font-weight:600}
.rg .navpill a.active:hover{background:#1d4a3a}
.rg .badge{color:var(--red);font-weight:500}
.rg .navright{display:flex;gap:16px;align-items:center}
.rg .iconbtn{background:none;border:0;font-size:16px;cursor:pointer}
.rg .avatar{width:36px;height:36px;border-radius:50%;background:#173d31;color:#fff;font-size:12px;display:grid;place-items:center}
.rg .titlebar{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px}
.rg .actions{display:flex;gap:12px;align-items:center}
.rg .tag{font-size:12px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.05);color:var(--muted)}
.rg .btn{font:inherit;font-size:14px;font-weight:500;padding:12px 18px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}
.rg .btn.primary{background:var(--green);border-color:var(--green);color:#fff;font-weight:600}
.rg .alert{display:flex;align-items:center;gap:16px;padding:28px 24px;border-left:4px solid var(--red);margin-bottom:24px}
.rg .alert-icon{color:var(--red)} .rg .alert-body{flex:1} .rg .alert-body strong{font-size:16px}
.rg .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-bottom:24px}
.rg .kpi{padding:24px 20px;display:flex;flex-direction:column;gap:6px;cursor:default}
.rg .kpi-label{font-size:14px;color:var(--muted)}
.rg .kpi-value{font-size:40px;font-weight:700;line-height:1.1}
.rg .kpi-sub{font-size:12px;color:var(--muted)}
.rg .kpi.hero{background:linear-gradient(135deg,#1c5a40,#2f8a5f);color:#fff}
.rg .kpi.hero .kpi-label,.rg .kpi.hero .kpi-sub{color:rgba(255,255,255,.85)}
.rg .kpi.danger .kpi-value{color:var(--red)}
.rg .grid{display:grid;grid-template-columns:1fr 420px;gap:26px;align-items:start;margin-bottom:24px}
.rg .col{display:flex;flex-direction:column;gap:26px}
.rg .mono-title{font-size:16px}
.rg .readings{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin:24px 0}
.rg .reading{border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,box-shadow .15s}
.rg .reading:hover{border-color:#a5c9b5;box-shadow:0 2px 10px rgba(20,50,40,.09)}
.rg .rlabel{font-size:14px}
.rg .rvalue{font-size:30px;font-weight:700}.rg .rvalue small{font-size:13px;font-weight:400;color:var(--muted)}
.rg .bar,.rg .sumbar{height:8px;background:#eceff0;border-radius:99px;overflow:hidden}
.rg .fill{height:100%;border-radius:99px}
.rg .fill.ok,.rg .fill.green{background:#1e7d4f}.rg .fill.warn{background:#8a5a00}
.rg .fill.blue{background:var(--blue)}.rg .fill.red{background:var(--red)}
.rg .status{display:flex;align-items:center;gap:6px;font-weight:600;font-size:14px}
.rg .status.ok{color:#1d6b47}.rg .status.warn{color:var(--amber)}
.rg .steps{display:flex;gap:28px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:20px;font-size:14px;color:var(--muted)}
.rg .step{display:flex;gap:6px;align-items:center}.rg .step.done{color:var(--ink);font-weight:600}
.rg .step.done svg{color:#1d6b47}
.rg .summary{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:20px}
.rg .sumcard{background:#eef2ef;border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;transition:background .15s,box-shadow .15s}
.rg .sumcard:hover{background:#e5ede8;box-shadow:0 2px 8px rgba(20,50,40,.09)}
.rg .sumcard .sumbar{width:100%;background:transparent}
.rg .sumvalue{font-size:32px;font-weight:700}
.rg .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:5px 11px;border-radius:999px;white-space:nowrap}
.rg .dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.rg .pill.green{background:#dff3e6;color:#1d6b47}.rg .pill.blue{background:#e1ebfa;color:var(--blue)}
.rg .pill.red{background:#fde4e1;color:var(--red)}.rg .pill.amber{background:#fdf0c7;color:var(--amber)}
.rg .decision{display:flex;flex-direction:column;gap:14px}
.rg .box{border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:12px;align-items:flex-start}
.rg .box>.row{width:100%}
.rg .box.white{border:1px solid var(--line)}.rg .box.grey{background:#eef2ef;border:1px solid var(--line)}
.rg .body{font-size:14px;line-height:1.6;color:#44524d;margin:0}
.rg .toolbar{margin:20px 0}
.rg .tabs{display:flex;gap:4px;background:#eef2ef;padding:4px;border-radius:10px}
.rg .tab{font:inherit;font-size:14px;border:0;background:none;padding:9px 16px;border-radius:8px;color:#44524d;cursor:pointer}
.rg .tab.active{background:#fff;color:var(--ink);font-weight:600;box-shadow:0 1px 2px rgba(0,0,0,.08)}
.rg .search{display:flex;gap:8px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:0 14px;width:260px;height:44px}
.rg .search input{border:0;outline:0;font:inherit;font-size:14px;width:100%}
.rg .tablewrap{overflow-x:auto}
.rg table{width:100%;border-collapse:collapse;font-size:14px}
.rg th{text-align:left;font-size:12px;font-weight:500;color:#44524d;padding:12px;border-bottom:1px solid var(--line)}
.rg td{padding:16px 12px;border-bottom:1px solid var(--line);white-space:nowrap}
.rg td.id{font-weight:700}.rg .rowwarn{color:var(--red);margin-right:4px;vertical-align:middle}
.rg .verified{display:inline-flex;gap:6px;align-items:center;font-weight:600}
.rg .foot{text-align:center;font-size:12px;color:var(--muted);margin-top:28px}
@media (max-width:1100px){
  .rg .grid{grid-template-columns:1fr}.rg .kpis{grid-template-columns:repeat(2,1fr)}
  .rg .readings{grid-template-columns:repeat(2,1fr)}.rg .navpill{display:none}
}
`;