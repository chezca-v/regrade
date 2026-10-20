"use client";

import "./globals.css";
import React, { useState } from "react";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";

function ChevronDownIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

interface DailyData {
  day: string;
  total: number;
  resellable: number;
  recycle: number;
  disposal: number;
}

const DAILY_RESULTS: DailyData[] = [
  { day: "Wed 7", total: 38, resellable: 23, recycle: 11, disposal: 4 },
  { day: "Thu 8", total: 45, resellable: 27, recycle: 13, disposal: 5 },
  { day: "Fri 9", total: 52, resellable: 32, recycle: 14, disposal: 6 },
  { day: "Sat 10", total: 31, resellable: 18, recycle: 10, disposal: 3 },
  { day: "Sun 11", total: 21, resellable: 12, recycle: 7, disposal: 2 },
  { day: "Mon 12", total: 49, resellable: 29, recycle: 14, disposal: 6 },
  { day: "Tue 13", total: 48, resellable: 27, recycle: 15, disposal: 6 },
];

interface ReasonItem {
  title: string;
  count: number;
  pct: number;
}

const TOP_REASONS: ReasonItem[] = [
  { title: "Casing swell above limit", count: 31, pct: 90 },
  { title: "No charging draw", count: 27, pct: 78 },
  { title: "High battery ESR", count: 24, pct: 70 },
  { title: "Temperature rise above limit", count: 22, pct: 64 },
  { title: "Missing mass", count: 17, pct: 50 },
];

interface SavedReport {
  id: string;
  name: string;
  period: string;
  created: string;
  format: "PDF" | "CSV";
}

const SAVED_REPORTS: SavedReport[] = [
  {
    id: "rep-1",
    name: "Weekly classification summary",
    period: "7 to 13 Oct 2026",
    created: "13 Oct 2026, 09:00",
    format: "PDF",
  },
  {
    id: "rep-2",
    name: "Safety alert log",
    period: "1 to 13 Oct 2026",
    created: "13 Oct 2026, 08:15",
    format: "CSV",
  },
  {
    id: "rep-3",
    name: "Audit log export",
    period: "Sep 2026",
    created: "1 Oct 2026, 07:30",
    format: "CSV",
  },
];

export function ReportsPage() {
  const [dateRange] = useState("7 to 13 Oct 2026");

  function downloadCsv(name: string, contents: string) {
    const blob = new Blob([contents], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function handleExportReport() {
    const rows = [
      ["Day", "Total tested", "Resellable", "Recycle", "Disposal"],
      ...DAILY_RESULTS.map((row) => [row.day, row.total, row.resellable, row.recycle, row.disposal]),
    ];
    downloadCsv("regrade-weekly-report.csv", rows.map((row) => row.join(",")).join("\r\n"));
  }

  function handleDownloadPdf() {
    window.print();
  }

  function handleDownload(report: SavedReport) {
    if (report.format === "CSV") {
      downloadCsv(
        `${report.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`,
        [["Report", "Period", "Created"], [report.name, report.period, report.created]]
          .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
          .join("\r\n"),
      );
      return;
    }
    window.print();
  }

  // Max daily total for proportional chart scaling (52 total -> 160px)
  const maxBarHeight = 170;
  const maxTotal = 56;

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Reports</h1>
              <p className="rg-sub">Results over time and saved exports. Sample data.</p>
            </div>
            <div className="rg-titlebar__actions">
              <div className="rg-date-select" tabIndex={0} role="button" aria-label="Select date range">
                <span>{dateRange}</span>
                <ChevronDownIcon />
              </div>
              <button className="rg-btn" onClick={handleExportReport}>Export CSV</button>
              <button className="rg-btn rg-btn--primary" onClick={handleDownloadPdf}>Print / Save PDF</button>
            </div>
          </div>

          {/* KPI Cards Row (4 cards) */}
          <section className="rg-kpi-grid" aria-label="Weekly report metrics">
            <div className="rg-kpi">
              <span className="rg-kpi__label">Devices tested</span>
              <span className="rg-kpi__value">284</span>
              <span className="rg-kpi__sub">Up 8% on the previous week</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Resellable</span>
              <span className="rg-kpi__value" style={{ color: "var(--rg-safe)" }}>
                57%
              </span>
              <span className="rg-kpi__sub">163 resellable classifications</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Recycle</span>
              <span className="rg-kpi__value" style={{ color: "var(--rg-recycle)" }}>
                31%
              </span>
              <span className="rg-kpi__sub">89 recycle classifications</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Disposal</span>
              <span className="rg-kpi__value rg-kpi--danger" style={{ color: "var(--rg-danger)" }}>
                11%
              </span>
              <span className="rg-kpi__sub">32 disposal classifications</span>
            </div>
          </section>

          {/* Middle Split: Daily Results Chart + Reasons */}
          <div className="rg-reports-split">
            {/* Left: Daily Results by Classification */}
            <section className="rg-card rg-card--pad rg-chart-card">
              <div className="rg-row rg-row--between">
                <div>
                  <h3>Daily results by classification</h3>
                  <p className="rg-small rg-muted">
                    Devices tested each day. The bar for today is still filling.
                  </p>
                </div>
                <div className="rg-chart-legend">
                  <Pill color="green">Resellable</Pill>
                  <Pill color="blue">Recycle</Pill>
                  <Pill color="red">Disposal</Pill>
                </div>
              </div>

              {/* Stacked Bar Chart */}
              <div className="rg-stacked-chart" aria-label="Daily results stacked bar chart">
                {DAILY_RESULTS.map((d) => {
                  const barHeight = Math.round((d.total / maxTotal) * maxBarHeight);
                  const disHeight = Math.round((d.disposal / d.total) * barHeight);
                  const recHeight = Math.round((d.recycle / d.total) * barHeight);
                  const resHeight = barHeight - disHeight - recHeight;

                  return (
                    <div key={d.day} className="rg-chart-col">
                      <span className="rg-chart-val">{d.total}</span>
                      <div className="rg-chart-bar" style={{ height: `${barHeight}px` }}>
                        <div
                          className="rg-bar-seg rg-bar-seg--red"
                          style={{ height: `${disHeight}px` }}
                          title={`Disposal: ${d.disposal}`}
                        />
                        <div
                          className="rg-bar-seg rg-bar-seg--blue"
                          style={{ height: `${recHeight}px` }}
                          title={`Recycle: ${d.recycle}`}
                        />
                        <div
                          className="rg-bar-seg rg-bar-seg--green"
                          style={{ height: `${resHeight}px` }}
                          title={`Resellable: ${d.resellable}`}
                        />
                      </div>
                      <span className="rg-chart-label">{d.day}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Right: Top reasons for Recycle and Disposal */}
            <section className="rg-card rg-card--pad">
              <h3>Top reasons for Recycle and Disposal</h3>
              <p className="rg-small rg-muted">121 devices, last 7 days</p>

              <div className="rg-reasons-list">
                {TOP_REASONS.map((r) => (
                  <div key={r.title} className="rg-reason-item">
                    <div className="rg-reason-head">
                      <span className="rg-reason-title">{r.title}</span>
                      <span className="rg-reason-count">{r.count}</span>
                    </div>
                    <div className="rg-reason-track">
                      <div className="rg-reason-fill" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Bottom Card: Saved Reports Table */}
          <section className="rg-card rg-card--pad">
            <h3>Saved reports</h3>
            <p className="rg-small rg-muted">Exports from the last 30 days.</p>

            <div className="rg-table-wrap" style={{ marginTop: "14px" }}>
              <table>
                <thead>
                  <tr>
                    <th>Report</th>
                    <th>Period</th>
                    <th>Created</th>
                    <th>Format</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {SAVED_REPORTS.map((rep) => (
                    <tr key={rep.id} className="rg-row-clickable">
                      <td>
                        <strong>{rep.name}</strong>
                      </td>
                      <td>{rep.period}</td>
                      <td>{rep.created}</td>
                      <td>
                        <span className="rg-format-pill">{rep.format}</span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="rg-btn"
                          onClick={() => handleDownload(rep)}
                        >
                          {rep.format === "PDF" ? "Print / Save PDF" : "Download CSV"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;
