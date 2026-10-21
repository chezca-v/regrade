"use client";

import "./globals.css";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { getReadings, isStableRecord, type DiagnosticRecord } from "@/lib/diagnostic-record-types";

const decisionLabels = {
  resellable: "Reuse review",
  recycle: "Recycle review",
  disposal: "Disposal review",
  "needs-review": "Needs more review",
} as const;

const decisionColors = {
  resellable: "green",
  recycle: "blue",
  disposal: "red",
  "needs-review": "amber",
} as const;

function reading(record: DiagnosticRecord, key: string, unit: string) {
  if (!isStableRecord(record)) return "Not stable";
  const value = getReadings(record.readings)[key];
  return typeof value === "number" ? `${value.toFixed(2)} ${unit}` : "Not reported";
}

export function DashboardPage({ records }: { records: DiagnosticRecord[] }) {
  const router = useRouter();
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const recent = records.filter((record) => new Date(record.reported_at).getTime() >= cutoff);
  const awaiting = records.filter((record) => !record.review || record.review.decision === "needs-review").length;
  const dispositionCount = (decision: string) => records.filter((record) => record.review?.decision === decision).length;

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div><h1>Diagnostics overview</h1><p className="rg-sub">Live station telemetry and your saved operator reviews.</p></div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn" onClick={() => router.push("/reports")}>View reports</button>
              <button className="rg-btn rg-btn--primary" onClick={() => router.push("/diagnostics")}>New diagnostic</button>
            </div>
          </div>

          <section className="rg-kpi-grid" aria-label="Diagnostic metrics">
            <div className="rg-kpi rg-kpi--hero"><span className="rg-kpi__label">Reports received, 24 hours</span><span className="rg-kpi__value">{recent.length}</span><span className="rg-kpi__sub">From station telemetry</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Awaiting operator review</span><span className="rg-kpi__value">{awaiting}</span><span className="rg-kpi__sub">No saved diagnosis for your account</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Reuse reviews</span><span className="rg-kpi__value">{dispositionCount("resellable")}</span><span className="rg-kpi__sub">Operator disposition, not an automated grade</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Recycle / disposal reviews</span><span className="rg-kpi__value">{dispositionCount("recycle") + dispositionCount("disposal")}</span><span className="rg-kpi__sub">Operator dispositions saved</span></div>
          </section>

          <section className="rg-card rg-card--pad">
            <div className="rg-row rg-row--between"><div><h3>Latest station reports</h3><p className="rg-small rg-muted">Raw readings are displayed only when station stability validation passed.</p></div><button className="rg-btn" onClick={() => router.push("/inventory")}>Open inventory</button></div>
            <div className="rg-table-wrap">
              <table>
                <thead><tr><th>Received</th><th>Session</th><th>Phone reference</th><th>Status</th><th>Weight</th><th>Thickness</th><th>Current</th><th>Review</th></tr></thead>
                <tbody>
                  {records.slice(0, 10).map((record) => <tr key={record.telemetry_id} className="rg-row-clickable" onClick={() => router.push(`/inventory/${record.session_id}`)}>
                    <td>{new Date(record.reported_at).toLocaleString()}</td><td>{record.session_id}</td>
                    <td>{record.phoneReference ? `${record.phoneReference.brand} ${record.phoneReference.model_name}` : "Not selected"}</td>
                    <td>{record.status}</td><td>{reading(record, "weight_g", "g")}</td><td>{reading(record, "thickness_mm", "mm")}</td><td>{reading(record, "current_ma", "mA")}</td>
                    <td>{record.review ? <Pill color={decisionColors[record.review.decision]}>{decisionLabels[record.review.decision]}</Pill> : <Pill color="amber">Awaiting review</Pill>}</td>
                  </tr>)}
                  {records.length === 0 && <tr><td colSpan={8}>No station reports have arrived yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
          <p className="rg-small rg-muted">This prototype’s external readings are screening information only. They do not establish battery-cell condition or device safety.</p>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
