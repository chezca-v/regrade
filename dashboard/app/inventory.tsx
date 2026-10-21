"use client";

import "./globals.css";
import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { SearchIcon, SortIcon, CheckIcon, WarnIcon } from "./components/Icons";
import { getReadings, isStableRecord, type DiagnosticRecord } from "@/lib/diagnostic-record-types";

export type TabCategory =
  | "All devices"
  | "Resellable"
  | "Recycle"
  | "Disposal"
  | "Needs verification";

const TABS: TabCategory[] = [
  "All devices",
  "Resellable",
  "Recycle",
  "Disposal",
  "Needs verification",
];

const decisionLabels = {
  resellable: "Suitable for reuse review",
  recycle: "Recycle review",
  disposal: "Disposal review",
  "needs-review": "Needs more review",
} as const;

export function InventoryPage({ records }: { records: DiagnosticRecord[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<TabCategory>("All devices");
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);

  const needsReview = (record: DiagnosticRecord) => !record.review || record.review.decision === "needs-review";
  const awaitingCount = records.filter(needsReview).length;
  const countDecision = (decision: string) => records.filter((record) => record.review?.decision === decision).length;
  const resellableCount = countDecision("resellable");
  const disposalCount = countDecision("disposal");

  const filtered = useMemo(() => records
    .filter((record) => {
      if (tab === "Needs verification") return needsReview(record);
      if (tab === "All devices") return true;
      return record.review?.decision === tab.toLowerCase();
    })
    .filter((record) => `${record.session_id} ${record.station_id} ${record.phoneReference?.brand ?? ""} ${record.phoneReference?.model_name ?? ""}`
      .toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sortNewest
      ? b.reported_at.localeCompare(a.reported_at)
      : a.reported_at.localeCompare(b.reported_at)), [records, tab, query, sortNewest]);

  function display(record: DiagnosticRecord, key: string, unit: string) {
    if (!isStableRecord(record)) return "—";
    const value = getReadings(record.readings)[key];
    return typeof value === "number" ? `${value.toFixed(2)} ${unit}` : "—";
  }

  function handleExportCsv() {
    const quote = (value: unknown) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [
      ["Session", "Station", "Phone reference", "Received", "Status", "Stable", "Weight (g)", "Thickness (mm)", "Current (mA)", "Temperature rise (°C)", "Operator review"],
      ...filtered.map((record) => [
        record.session_id,
        record.station_id,
        record.phoneReference ? `${record.phoneReference.brand} ${record.phoneReference.model_name}` : "",
        record.reported_at,
        record.status,
        isStableRecord(record) ? "yes" : "no",
        display(record, "weight_g", ""),
        display(record, "thickness_mm", ""),
        display(record, "current_ma", ""),
        display(record, "temperature_rise_c", ""),
        record.review ? decisionLabels[record.review.decision] : "Awaiting operator review",
      ]),
    ];
    const blob = new Blob([rows.map((row) => row.map(quote).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "regrade-inventory.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div>
              <h1>Inventory</h1>
              <p className="rg-sub">Station reports and saved operator reviews from Supabase.</p>
            </div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn" onClick={handleExportCsv}>Export CSV</button>
              <button className="rg-btn rg-btn--primary" onClick={() => router.push("/diagnostics")}>＋ New diagnostic</button>
            </div>
          </div>

          <section className="rg-kpi-grid" aria-label="Inventory metrics">
            <div className="rg-kpi"><span className="rg-kpi__label">Station reports</span><span className="rg-kpi__value">{records.length}</span><span className="rg-kpi__sub">Received telemetry records</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Awaiting review</span><span className="rg-kpi__value">{awaitingCount}</span><span className="rg-kpi__sub">No operator diagnosis saved</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Reuse review</span><span className="rg-kpi__value" style={{ color: "var(--rg-safe)" }}>{resellableCount}</span><span className="rg-kpi__sub">Operator-selected disposition</span></div>
            <div className="rg-kpi"><span className="rg-kpi__label">Disposal review</span><span className="rg-kpi__value" style={{ color: "var(--rg-danger)" }}>{disposalCount}</span><span className="rg-kpi__sub">Operator-selected disposition</span></div>
          </section>

          <section className="rg-card rg-card--pad">
            <div className="rg-row rg-row--between">
              <div><h3>Audit log</h3><p className="rg-small rg-muted">Only calibrated stable readings are displayed.</p></div>
            </div>
            <div className="rg-toolbar">
              <div className="rg-tabs" role="tablist">
                {TABS.map((item) => <button key={item} className={`rg-tab${tab === item ? " rg-tab--active" : ""}`} role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}
              </div>
              <div className="rg-row rg-row--gap8">
                <label className="rg-search" htmlFor="inv-audit-search"><SearchIcon /><input id="inv-audit-search" placeholder="Search session or model..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search session or model" /></label>
                <button className="rg-btn rg-btn--sort" onClick={() => setSortNewest((value) => !value)} aria-pressed={sortNewest}><SortIcon /> {sortNewest ? "Newest first" : "Oldest first"}</button>
              </div>
            </div>
            <div className="rg-table-wrap">
              <table>
                <thead><tr><th>Session / station</th><th>Phone reference</th><th>Received</th><th>Status</th><th>Weight</th><th>Thickness</th><th>Current</th><th>Temp rise</th><th>Operator review</th></tr></thead>
                <tbody>
                  {filtered.map((record) => {
                    const warning = Boolean(record.fault);
                    const color = record.review?.decision === "resellable" ? "green" : record.review?.decision === "recycle" ? "blue" : record.review?.decision === "disposal" ? "red" : "amber";
                    return <tr key={record.telemetry_id} className="rg-row-clickable" onClick={() => router.push(`/inventory/${record.session_id}`)}>
                      <td><span className="rg-row rg-row--gap6">{warning && <span className="rg-warn-icon"><WarnIcon size={14} /></span>}<strong>{record.session_id}</strong><br />{record.station_id}</span></td>
                      <td>{record.phoneReference ? `${record.phoneReference.brand} ${record.phoneReference.model_name}` : "Not selected"}</td>
                      <td>{new Date(record.reported_at).toLocaleString()}</td>
                      <td>{record.status}{!isStableRecord(record) ? " · not stable" : ""}</td>
                      <td>{display(record, "weight_g", "g")}</td>
                      <td>{display(record, "thickness_mm", "mm")}</td>
                      <td>{display(record, "current_ma", "mA")}</td>
                      <td>{display(record, "temperature_rise_c", "°C")}</td>
                      <td>{record.review ? <span className="rg-row rg-row--gap6"><CheckIcon size={14} /><Pill color={color}>{decisionLabels[record.review.decision]}</Pill></span> : <Pill color="amber">Awaiting review</Pill>}</td>
                    </tr>;
                  })}
                  {filtered.length === 0 && <tr><td colSpan={9}>No station reports match this filter yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InventoryPage;
