import React from "react";

/* ---------- Hardcoded data ---------- */

const NAV = ["Overview", "Diagnostics", "Inventory", "Sorting", "Safety alerts", "Reports"];

const STAGES = [
  { title: "Scan", sub: "Done at 14:41", state: "done" },
  { title: "Electrical check", sub: "In progress", state: "active" },
  { title: "Grade", sub: "Waiting", state: "waiting" },
  { title: "Sort", sub: "Waiting", state: "waiting" },
  { title: "Report", sub: "Waiting", state: "waiting" },
] as const;

const READINGS = [
  { label: "Battery ESR", value: null, unit: "mΩ", pct: 0, limit: "Limit 250 mΩ", status: "Measuring", tone: "measuring" },
  { label: "Power draw", value: "610", unit: "mA", pct: 76, limit: "Range 500 to 800 mA", status: "In range", tone: "ok" },
  { label: "Temperature rise", value: "4.2", unit: "°C", pct: 28, limit: "Limit 15 °C", status: "Within limit", tone: "ok" },
  { label: "Casing swell", value: "0.5", unit: "mm", pct: 25, limit: "Limit 2.0 mm", status: "Within limit", tone: "ok" },
];

const GRADING = [
  { tone: "green", label: "Resellable / Refurbishable", weight: "Within 5% of nominal", swell: "2.0 mm or less", temp: "15 °C or less", draw: "Above 500 mA", bin: "Bin A" },
  { tone: "blue", label: "Recycle / Safe Dismantling", weight: "More than 15% under nominal", swell: "More than 2.0 mm", temp: "15 °C or less", draw: "Below 50 mA", bin: "Bin B" },
  { tone: "red", label: "Disposal", weight: "Irregular, with heavy swelling", swell: "More than 3.5 mm", temp: "More than 15 °C", draw: "Short circuit or overcurrent", bin: "Bin C" },
];

const QUEUE = [
  { id: "REG-20261013-009", model: "Smartphone, Model X14" },
  { id: "REG-20261013-010", model: "Smartphone, Model S2" },
  { id: "REG-20261013-011", model: "Smartphone, Model X12" },
  { id: "REG-20261013-012", model: "Smartphone, Model S1" },
];

/* ---------- Small pieces ---------- */

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
const Clock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
  </svg>
);
const Laptop = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="5" width="14" height="10" rx="1.5" /><path d="M3 19h18" />
  </svg>
);
const Pill = ({ tone, children }: { tone: string; children: React.ReactNode }) => (
  <span className={`pill ${tone}`}><i className="dot" />{children}</span>
);

/* ---------- Page ---------- */

export default function Diagnostics() {
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
          <span>
            ReGrade
            <small>E-waste diagnostics</small>
          </span>
        </div>
        <nav className="navpill">
          {NAV.map((n) => (
            <a key={n} className={n === "Diagnostics" ? "active" : ""} href="#">
              {n}{n === "Safety alerts" && <b className="badge">2</b>}
            </a>
          ))}
        </nav>
        <div className="navright">
          <button className="iconbtn" aria-label="Notifications">🔔</button>
          <button className="iconbtn" aria-label="Settings">⚙</button>
          <span className="avatar light">OP</span>
        </div>
      </header>

      {/* Title */}
      <div className="titlebar">
        <div>
          <h1>Diagnostics</h1>
          <p className="muted">Current test, grading rules and the device queue. Sample data, no hardware connected.</p>
        </div>
        <div className="actions">
          <button className="btn">View reference weights</button>
          <button className="btn primary">＋ New diagnostic test</button>
        </div>
      </div>

      {/* Current test */}
      <section className="card pad">
        <div className="row between">
          <div>
            <h3>Current test</h3>
            <p className="small muted">REG-20261013-008, Smartphone, Model X12 (placeholder). Weight 166 g, 1% under nominal.</p>
          </div>
          <span className="tag">In progress: Electrical check</span>
        </div>

        <div className="stages">
          {STAGES.map((s) => (
            <div key={s.title} className={`stage ${s.state}`}>
              <span className="stage-icon">{s.state === "done" ? <Check /> : <Clock />}</span>
              <div>
                <strong>{s.title}</strong>
                <span className="small muted">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="readings">
          {READINGS.map((r) => (
            <div key={r.label} className="reading">
              <span className="rlabel">{r.label}</span>
              <span className="rvalue">
                {r.value ?? <span className="dash" />} <small>{r.unit}</small>
              </span>
              <div className="bar"><div className="fill ok" style={{ width: `${r.pct}%` }} /></div>
              <span className="small muted">{r.limit}</span>
              <span className={`status ${r.tone}`}>
                {r.tone === "ok" && <Check />} {r.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Grading + queue */}
      <div className="grid">
        <section className="card pad">
          <h3>How each result is graded</h3>
          <p className="small muted">The diagnostic result follows these limits. An operator verifies it before routing.</p>

          <table className="grading">
            <thead>
              <tr>
                {["Classification", "Weight", "Casing swell", "Temp rise", "Charging draw", "Bin"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GRADING.map((g) => (
                <tr key={g.label}>
                  <td><Pill tone={g.tone}>{g.label}</Pill></td>
                  <td>{g.weight}</td>
                  <td>{g.swell}</td>
                  <td>{g.temp}</td>
                  <td>{g.draw}</td>
                  <td>{g.bin}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="small muted note">Battery ESR limits are placeholders until the team confirms them.</p>
        </section>

        <aside className="card pad">
          <h3>Device queue</h3>
          <p className="small muted">{QUEUE.length} devices waiting for a test</p>
          <ul className="queue">
            {QUEUE.map((q) => (
              <li key={q.id}>
                <span className="qicon"><Laptop /></span>
                <div className="qtext">
                  <strong>{q.id}</strong>
                  <span className="small muted">{q.model}</span>
                </div>
                <span className="tag">Waiting</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
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
.rg .card{background:#fff;border-radius:16px;box-shadow:0 1px 3px rgba(20,50,40,.08);transition:box-shadow .18s,transform .18s}
.rg .card:hover{box-shadow:0 6px 20px rgba(20,50,40,.13);transform:translateY(-2px)}
.rg .pad{padding:24px}
.rg .nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px}
.rg .brand{display:flex;align-items:center;gap:12px;font-size:22px;font-weight:600;color:var(--green-d);line-height:1.1}
.rg .brand small{display:block;font-size:12px;font-weight:400;color:var(--muted);margin-top:4px}
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
.rg .avatar.light{background:#d9e6de;color:#1d4a3a}
.rg .titlebar{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px}
.rg .actions{display:flex;gap:12px;align-items:center}
.rg .tag{font-size:12px;padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.05);color:var(--muted);white-space:nowrap}
.rg .btn{font:inherit;font-size:14px;font-weight:500;padding:12px 18px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}
.rg .btn.primary{background:var(--green);border-color:var(--green);color:#fff;font-weight:600}
.rg .stages{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:24px 0}
.rg .stage{display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px;background:#eef2ef;border:1px solid transparent;transition:background .15s,box-shadow .15s}
.rg .stage:hover{background:#e5ede8;box-shadow:0 2px 8px rgba(20,50,40,.09)}
.rg .stage strong{display:block;font-size:15px}
.rg .stage.done .stage-icon{color:var(--green-d)}
.rg .stage.active{background:#eef6f1;border-color:var(--green)}
.rg .stage.active .stage-icon{color:var(--green)}
.rg .stage.waiting .stage-icon{color:#5d6b66}
.rg .readings{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.rg .reading{border:1px solid var(--line);border-radius:12px;padding:16px;display:flex;flex-direction:column;gap:8px;transition:border-color .15s,box-shadow .15s}
.rg .reading:hover{border-color:#a5c9b5;box-shadow:0 2px 10px rgba(20,50,40,.09)}
.rg .rlabel{font-size:14px}
.rg .rvalue{font-size:30px;font-weight:700;display:flex;align-items:baseline;gap:6px;min-height:44px}
.rg .rvalue small{font-size:13px;font-weight:400;color:var(--muted)}
.rg .dash{display:inline-block;width:22px;height:4px;background:var(--ink);border-radius:2px;align-self:center}
.rg .bar{height:8px;background:#eceff0;border-radius:99px;overflow:hidden}
.rg .fill{height:100%;border-radius:99px}
.rg .fill.ok{background:#1e7d4f}
.rg .status{display:flex;align-items:center;gap:6px;font-weight:600;font-size:14px;min-height:20px}
.rg .status.ok{color:#1d6b47}.rg .status.measuring{color:#44524d}
.rg .grid{display:grid;grid-template-columns:1fr 420px;gap:26px;align-items:start;margin-top:26px}
.rg .pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;padding:5px 11px;border-radius:999px;white-space:nowrap}
.rg .dot{width:6px;height:6px;border-radius:50%;background:currentColor}
.rg .pill.green{background:#dff3e6;color:#1d6b47}.rg .pill.blue{background:#e1ebfa;color:var(--blue)}
.rg .pill.red{background:#fde4e1;color:var(--red)}
.rg table.grading{width:100%;border-collapse:collapse;font-size:14px;margin-top:20px}
.rg .grading th{text-align:left;font-size:12px;font-weight:500;color:#44524d;padding:12px;border-bottom:1px solid var(--line)}
.rg .grading td{padding:16px 12px;border-bottom:1px solid var(--line);line-height:1.5;vertical-align:middle}
.rg .note{margin-top:20px}
.rg .queue{list-style:none;margin:16px 0 0;padding:0}
.rg .queue li{display:flex;align-items:center;gap:12px;padding:16px 0;border-bottom:1px solid var(--line)}
.rg .qicon{width:40px;height:40px;border-radius:10px;background:#dff3e6;color:#1d6b47;display:grid;place-items:center}
.rg .qtext{flex:1;display:flex;flex-direction:column;gap:2px}
.rg .qtext strong{font-size:14px}
@media (max-width:1100px){
  .rg .grid{grid-template-columns:1fr}.rg .stages{grid-template-columns:repeat(2,1fr)}
  .rg .readings{grid-template-columns:repeat(2,1fr)}.rg .navpill{display:none}
}
`;