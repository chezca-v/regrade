"use client";

import "./globals.css";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { SearchIcon, SortIcon, CheckIcon, WarnIcon } from "./components/Icons";

export type TabCategory =
  | "All devices"
  | "Resellable"
  | "Recycle"
  | "Disposal"
  | "Needs verification";

export interface AuditRecord {
  id: string;
  time: string;
  esr: string;
  powerDraw: string;
  tempRise: string;
  swell: string;
  result: "resellable" | "recycle" | "disposal";
  resultLabel: string;
  decision: "Awaiting verification" | "Verified, Bin A" | "Verified, Bin B" | "Verified, Bin C";
  hasWarning?: boolean;
}

const INVENTORY_DATA: AuditRecord[] = [
  {
    id: "REG-20261013-012",
    time: "15:04",
    esr: "128 mΩ",
    powerDraw: "672 mA",
    tempRise: "9.7 °C",
    swell: "0.5 mm",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    decision: "Awaiting verification",
  },
  {
    id: "REG-20261013-011",
    time: "14:51",
    esr: "126 mΩ",
    powerDraw: "701 mA",
    tempRise: "9.1 °C",
    swell: "0.4 mm",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    decision: "Verified, Bin A",
  },
  {
    id: "REG-20261013-010",
    time: "14:44",
    esr: "—",
    powerDraw: "8 mA",
    tempRise: "0.9 °C",
    swell: "2.8 mm",
    result: "recycle",
    resultLabel: "Recycle / Safe Dismantling",
    decision: "Verified, Bin B",
  },
  {
    id: "REG-20261013-009",
    time: "14:37",
    esr: "133 mΩ",
    powerDraw: "688 mA",
    tempRise: "12.2 °C",
    swell: "0.7 mm",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    decision: "Verified, Bin A",
  },
  {
    id: "REG-20261013-007",
    time: "14:32",
    esr: "142 mΩ",
    powerDraw: "640 mA",
    tempRise: "11.8 °C",
    swell: "0.6 mm",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    decision: "Awaiting verification",
  },
  {
    id: "REG-20261013-006",
    time: "14:21",
    esr: "390 mΩ",
    powerDraw: "1,240 mA",
    tempRise: "18.4 °C",
    swell: "3.9 mm",
    result: "disposal",
    resultLabel: "Disposal",
    decision: "Verified, Bin C",
  },
  {
    id: "REG-20261013-005",
    time: "14:09",
    esr: "—",
    powerDraw: "12 mA",
    tempRise: "1.1 °C",
    swell: "2.4 mm",
    result: "recycle",
    resultLabel: "Recycle / Safe Dismantling",
    decision: "Verified, Bin B",
  },
  {
    id: "REG-20261013-004",
    time: "13:57",
    esr: "412 mΩ",
    powerDraw: "980 mA",
    tempRise: "16.2 °C",
    swell: "4.1 mm",
    result: "disposal",
    resultLabel: "Disposal",
    decision: "Awaiting verification",
    hasWarning: true,
  },
  {
    id: "REG-20261013-003",
    time: "13:44",
    esr: "118 mΩ",
    powerDraw: "710 mA",
    tempRise: "8.3 °C",
    swell: "0.3 mm",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    decision: "Verified, Bin A",
  },
  {
    id: "REG-20261013-002",
    time: "13:31",
    esr: "122 mΩ",
    powerDraw: "690 mA",
    tempRise: "7.9 °C",
    swell: "0.2 mm",
    result: "resellable",
    resultLabel: "Resellable / Refurbishable",
    decision: "Verified, Bin A",
  },
];

const TABS: TabCategory[] = [
  "All devices",
  "Resellable",
  "Recycle",
  "Disposal",
  "Needs verification",
];

export function InventoryPage() {
  const router = useRouter();
  const [records] = useState<AuditRecord[]>(INVENTORY_DATA);
  const [tab, setTab] = useState<TabCategory>("All devices");
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);

  const awaitingCount = records.filter((r) => r.decision === "Awaiting verification").length;
  const resellableCount = records.filter((r) => r.result === "resellable").length;
  const disposalCount = records.filter((r) => r.result === "disposal").length;

  const filtered = useMemo(() => {
    return records
      .filter((r) => {
        if (tab === "Resellable") return r.result === "resellable";
        if (tab === "Recycle") return r.result === "recycle";
        if (tab === "Disposal") return r.result === "disposal";
        if (tab === "Needs verification") return r.decision === "Awaiting verification";
        return true;
      })
      .filter((r) => r.id.toLowerCase().includes(query.toLowerCase()));
  }, [records, tab, query]);

  function handleExportCsv() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Time,ESR,PowerDraw,TempRise,Swell,Result,Decision"]
        .concat(
          records.map(
            (r) =>
              `"${r.id}","${r.time}","${r.esr}","${r.powerDraw}","${r.tempRise}","${r.swell}","${r.resultLabel}","${r.decision}"`
          )
        )
        .join("\n");
    const encoded = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encoded;
    link.download = "regrade-inventory.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Inventory</h1>
              <p className="rg-sub">
                Processed and incoming smartphone inventory across all bins.
              </p>
            </div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn" onClick={handleExportCsv}>
                Export CSV
              </button>
              <button className="rg-btn rg-btn--primary">＋ Add device</button>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <section className="rg-kpi-grid" aria-label="Inventory metrics">
            <div className="rg-kpi">
              <span className="rg-kpi__label">Devices on record</span>
              <span className="rg-kpi__value">1,284</span>
              <span className="rg-kpi__sub">Across all 3 facility bins</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Awaiting verification</span>
              <span className="rg-kpi__value">{awaitingCount}</span>
              <span className="rg-kpi__sub">Operator action required</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Resellable / Refurbishable</span>
              <span className="rg-kpi__value" style={{ color: "var(--rg-safe)" }}>
                612
              </span>
              <span className="rg-kpi__sub">48% of total inventory</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Disposal</span>
              <span className="rg-kpi__value" style={{ color: "var(--rg-danger)" }}>
                38
              </span>
              <span className="rg-kpi__sub">Hazardous or beyond repair</span>
            </div>
          </section>

          {/* Audit Log Card */}
          <section className="rg-card rg-card--pad">
            <div className="rg-row rg-row--between">
              <div>
                <h3>Audit log</h3>
                <p className="rg-small rg-muted">
                  Newest first. Click any row to view complete device diagnostic readings.
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="rg-toolbar">
              <div className="rg-tabs" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t}
                    className={`rg-tab${tab === t ? " rg-tab--active" : ""}`}
                    role="tab"
                    aria-selected={tab === t}
                    onClick={() => setTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="rg-row rg-row--gap8">
                <label className="rg-search" htmlFor="inv-audit-search">
                  <SearchIcon />
                  <input
                    id="inv-audit-search"
                    placeholder="Search device ID..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search device ID"
                  />
                </label>
                <button
                  className="rg-btn rg-btn--sort"
                  onClick={() => setSortNewest((v) => !v)}
                  aria-pressed={sortNewest}
                >
                  <SortIcon /> {sortNewest ? "Newest first" : "Oldest first"}
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="rg-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Device ID</th>
                    <th>Time</th>
                    <th>ESR</th>
                    <th>Power draw</th>
                    <th>Temp rise</th>
                    <th>Swell</th>
                    <th>Diagnostic result</th>
                    <th>Processing decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => {
                    const isAwaiting = record.decision === "Awaiting verification";
                    const pillColor =
                      record.result === "resellable"
                        ? "green"
                        : record.result === "recycle"
                        ? "blue"
                        : "red";

                    return (
                      <tr
                        key={record.id}
                        className="rg-row-clickable"
                        onClick={() => router.push(`/inventory/${record.id}`)}
                      >
                        <td>
                          <span className="rg-row rg-row--gap6">
                            {record.hasWarning && (
                              <span className="rg-warn-icon">
                                <WarnIcon size={14} />
                              </span>
                            )}
                            <strong>{record.id}</strong>
                          </span>
                        </td>
                        <td>{record.time}</td>
                        <td>{record.esr}</td>
                        <td>{record.powerDraw}</td>
                        <td>{record.tempRise}</td>
                        <td>{record.swell}</td>
                        <td>
                          <Pill color={pillColor}>{record.resultLabel}</Pill>
                        </td>
                        <td>
                          {isAwaiting ? (
                            <Pill color="amber">Awaiting verification</Pill>
                          ) : (
                            <span className="rg-row rg-row--gap6">
                              <CheckIcon size={14} />
                              {record.decision}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="rg-table-pagination">
              <div>
                Showing 1 to {filtered.length} of 1,284 sample records
              </div>
              <div className="rg-row rg-row--gap8">
                <button className="rg-btn">Previous</button>
                <button className="rg-btn">Next</button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default InventoryPage;
