"use client";

import "./globals.css";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { getReadings, isStableRecord, type DiagnosticRecord } from "@/lib/diagnostic-record-types";

type DailySummary = {
  date: Date;
  total: number;
  resellable: number;
  recycle: number;
  disposal: number;
};

function csvCell(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function ReportsPage({ records }: { records: DiagnosticRecord[] }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
  const daily: DailySummary[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + index);
    const matches = records.filter((record) => {
      const reportedAt = new Date(record.reported_at);
      return reportedAt.getFullYear() === date.getFullYear() &&
        reportedAt.getMonth() === date.getMonth() &&
        reportedAt.getDate() === date.getDate();
    });
    return {
      date,
      total: matches.length,
      resellable: matches.filter((record) => record.review?.decision === "resellable").length,
      recycle: matches.filter((record) => record.review?.decision === "recycle").length,
      disposal: matches.filter((record) => record.review?.decision === "disposal").length,
    };
  });
  const reviewedCount = records.filter((record) => record.review).length;
  const awaitingCount = records.filter((record) => !record.review || record.review.decision === "needs-review").length;
  const reuseCount = records.filter((record) => record.review?.decision === "resellable").length;
  const recycleCount = records.filter((record) => record.review?.decision === "recycle").length;
  const disposalCount = records.filter((record) => record.review?.decision === "disposal").length;
  const maxTotal = Math.max(1, ...daily.map((day) => day.total));
  const faults = new Map<string, number>();
  for (const record of records) {
    if (record.fault) faults.set(record.fault, (faults.get(record.fault) ?? 0) + 1);
  }
  const topFaults = [...faults.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  function downloadCsv() {
    const rows = [
      ["Session", "Station", "Reported at", "Status", "Stable", "Phone reference", "Weight (g)", "Thickness (mm)", "Current (mA)", "Surface temperature (C)", "Temperature rise (C)", "Grade", "Operator disposition", "Fault"],
      ...records.map((record) => {
        const readings = isStableRecord(record) ? getReadings(record.readings) : {};
        return [
          record.session_id,
          record.station_id,
          record.reported_at,
          record.status,
          isStableRecord(record),
          record.phoneReference ? `${record.phoneReference.brand} ${record.phoneReference.model_name}` : "",
          readings.weight_g,
          readings.thickness_mm,
          readings.current_ma,
          readings.surface_temp_c,
          readings.temperature_rise_c,
          isStableRecord(record) ? record.grade : null,
          record.review?.decision,
          record.fault,
        ];
      }),
    ];
    const blob = new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "regrade-diagnostic-reports.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div><h1>Reports</h1><p className="rg-sub">Station reports and saved operator dispositions from Supabase.</p></div>
            <div className="rg-titlebar__actions"><button className="rg-btn" onClick={downloadCsv}>Export CSV</button><button className="rg-btn rg-btn--primary" onClick={() => window.print()}>Print / Save PDF</button></div>
          </div>

          <section className="rg-kpi-grid" aria-label="Report metrics">
            <div className="rg-kpi"><span className="rg-kpi__label">Station reports</span><span className="rg-kpi__value">{records.length}</span><span className="rg-kpi__sub">All available reports</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Operator reviews saved</span><span className="rg-kpi__value">{reviewedCount}</span><span className="rg-kpi__sub">{awaitingCount} awaiting review</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Reuse reviews</span><span className="rg-kpi__value">{reuseCount}</span><span className="rg-kpi__sub">Operator-selected disposition</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Recycle / disposal reviews</span><span className="rg-kpi__value">{recycleCount + disposalCount}</span><span className="rg-kpi__sub">{recycleCount} recycle · {disposalCount} disposal</span></div>
          </section>

          <div className="rg-reports-split">
            <section className="rg-card rg-card--pad rg-chart-card">
              <h3>Daily reports and operator reviews</h3>
              <p className="rg-small rg-muted">Last seven days. Categories reflect operator dispositions, not firmware grades.</p>
              <div className="rg-chart-legend"><Pill color="green">Reuse review</Pill><Pill color="blue">Recycle review</Pill><Pill color="red">Disposal review</Pill></div>
              <div className="rg-stacked-chart" aria-label="Daily station reports">
                {daily.map((day) => {
                  const totalHeight = Math.round((day.total / maxTotal) * 150);
                  const disposalHeight = day.total ? Math.round((day.disposal / day.total) * totalHeight) : 0;
                  const recycleHeight = day.total ? Math.round((day.recycle / day.total) * totalHeight) : 0;
                  const reuseHeight = day.total ? Math.round((day.resellable / day.total) * totalHeight) : 0;
                  const unreviewedHeight = Math.max(0, totalHeight - disposalHeight - recycleHeight - reuseHeight);
                  return <div key={day.date.toISOString()} className="rg-chart-col">
                    <span className="rg-chart-val">{day.total}</span>
                    <div className="rg-chart-bar" style={{ height: `${totalHeight}px` }}>
                      {unreviewedHeight > 0 && <div className="rg-bar-seg" style={{ height: `${unreviewedHeight}px`, background: "var(--rg-line)" }} title="Awaiting review" />}
                      <div className="rg-bar-seg rg-bar-seg--red" style={{ height: `${disposalHeight}px` }} title={`Disposal review: ${day.disposal}`} />
                      <div className="rg-bar-seg rg-bar-seg--blue" style={{ height: `${recycleHeight}px` }} title={`Recycle review: ${day.recycle}`} />
                      <div className="rg-bar-seg rg-bar-seg--green" style={{ height: `${reuseHeight}px` }} title={`Reuse review: ${day.resellable}`} />
                    </div>
                    <span className="rg-chart-label">{day.date.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</span>
                  </div>;
                })}
              </div>
            </section>

            <section className="rg-card rg-card--pad">
              <h3>Reported station faults</h3>
              <p className="rg-small rg-muted">{faults.size ? "Counts from telemetry fault fields." : "No faults have been reported."}</p>
              {topFaults.length ? <div className="rg-reasons-list">
                {topFaults.map(([fault, count]) => <div key={fault} className="rg-reason-item"><div className="rg-reason-head"><span className="rg-reason-title">{fault}</span><span className="rg-reason-count">{count}</span></div></div>)}
              </div> : <p className="rg-small">No station faults recorded.</p>}
            </section>
          </div>

          <section className="rg-card rg-card--pad">
            <h3>Recent station reports</h3>
            <p className="rg-small rg-muted">Saved dispositions are shown where available. Unstable sensor values are omitted.</p>
            <div className="rg-table-wrap">
              <table>
                <thead><tr><th>Reported</th><th>Session</th><th>Phone reference</th><th>Status</th><th>Stable</th><th>Operator disposition</th></tr></thead>
                <tbody>{records.slice(0, 30).map((record) => <tr key={record.telemetry_id}>
                  <td>{new Date(record.reported_at).toLocaleString()}</td><td>{record.session_id}</td>
                  <td>{record.phoneReference ? `${record.phoneReference.brand} ${record.phoneReference.model_name}` : "Not selected"}</td>
                  <td>{record.status}</td><td>{isStableRecord(record) ? "Yes" : "No"}</td><td>{record.review?.decision ?? "Awaiting review"}</td>
                </tr>)}{records.length === 0 && <tr><td colSpan={6}>No station reports are available.</td></tr>}</tbody>
              </table>
            </div>
          </section>
          <p className="rg-small rg-muted">These measurements are screening indicators only; they do not establish battery-cell condition or device safety.</p>
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;
