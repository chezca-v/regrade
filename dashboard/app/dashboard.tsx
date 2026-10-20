"use client";

import "./globals.css";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { ReadingCard } from "./components/ReadingCard";
import { CheckIcon, ClockIcon, WarnIcon, SearchIcon, SortIcon } from "./components/Icons";
import { DEVICES } from "@/lib/rg-data";
import {
  RESULT_LABEL,
  RESULT_COLOR,
  filterDevices,
  countTestedToday,
  countAwaiting,
  countResellable,
  countByResult,
  pctByResult,
  fmtDate,
  type AuditTab,
} from "@/lib/rg-helpers";
import type { DiagnosticResult } from "@/lib/rg-types";

const TABS: { id: AuditTab; label: string }[] = [
  { id: "all", label: "All devices" },
  { id: "resellable", label: "Resellable" },
  { id: "recycle", label: "Recycle" },
  { id: "disposal", label: "Disposal" },
  { id: "awaiting", label: "Needs verification" },
];

export function DashboardPage() {
  const router = useRouter();
  const devices = DEVICES;
  const [selectedId, setSelectedId] = useState<string>(DEVICES[0].id);
  const selected = devices.find((device) => device.id === selectedId) ?? devices[0];
  const [tab, setTab] = useState<AuditTab>("all");
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);

  const totalTested = countTestedToday(devices);
  const awaitingCount = countAwaiting(devices);
  const resellableCount = countResellable(devices);
  const resellPct = pctByResult(devices, "resellable");

  const filteredDevices = useMemo(
    () => filterDevices(devices, tab, query, sortNewest),
    [devices, tab, query, sortNewest]
  );

  const today = fmtDate(new Date());

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Diagnostics overview</h1>
              <p className="rg-sub">Sample recycling center, {today}</p>
            </div>
            <div className="rg-titlebar__actions">
              <span className="rg-tag">Sample data</span>
              <button className="rg-btn" onClick={() => router.push("/reports")}>View reports</button>
              <button
                className="rg-btn rg-btn--primary"
                onClick={() => router.push("/diagnostics")}
              >
                Open diagnostics
              </button>
            </div>
          </div>

          {/* KPI cards */}
          <section className="rg-kpi-grid" aria-label="Today's KPIs">
            <div className="rg-kpi rg-kpi--hero">
              <span className="rg-kpi__label">Tested today</span>
              <span className="rg-kpi__value">{totalTested}</span>
              <span className="rg-kpi__sub">
                {awaitingCount} awaiting verification
              </span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Awaiting verification</span>
              <span className="rg-kpi__value">{awaitingCount}</span>
              <span className="rg-kpi__sub">Sample results awaiting operator review</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Resellable / Refurbishable</span>
              <span className="rg-kpi__value">{resellableCount}</span>
              <span className="rg-kpi__sub">
                {resellPct}% of devices tested today
              </span>
            </div>
          </section>

          {/* Middle grid: device detail + decision */}
          <div className="rg-mid-grid rg-mid-grid--overview">
            <div className="rg-mid-left">
              {/* Device detail */}
              <section className="rg-card rg-card--pad">
                <div className="rg-row rg-row--between">
                  <div>
                    <h3 className="rg-device-id">{selected.id}</h3>
                    <p className="rg-small rg-muted">
                      {selected.brand === "Unknown" ? "Brand not recorded" : selected.brand}, {selected.model} · Reference weight {selected.nominalWeight} g
                    </p>
                  </div>
                  <span className="rg-small rg-muted rg-row rg-row--gap6">
                    <ClockIcon /> Test completed {selected.time}
                  </span>
                </div>

                <div className="rg-readings-grid">
                  {selected.readings.map((r) => (
                    <ReadingCard key={r.label} reading={r} />
                  ))}
                </div>

                {/* Steps */}
                <div className="rg-steps">
                  {[
                    { label: "Scan", done: true },
                    { label: "Electrical check", done: true },
                    { label: "Review results", done: true },
                    { label: "Save diagnosis", done: false },
                  ].map((s) => (
                    <span
                      key={s.label}
                      className={`rg-step${s.done ? " rg-step--done" : ""}`}
                    >
                      {s.done ? <CheckIcon /> : <ClockIcon />} {s.label}
                    </span>
                  ))}
                </div>
              </section>

              {/* Classification summary */}
              <section className="rg-card rg-card--pad">
                <h3>Classification summary</h3>
                <p className="rg-small rg-muted">
                  {totalTested} devices tested today. Diagnostic results, including those awaiting verification.
                </p>
                <div className="rg-summary-grid">
                  {(["resellable", "recycle", "disposal"] as DiagnosticResult[]).map(
                    (r) => {
                      const count = countByResult(devices, r);
                      const pct = pctByResult(devices, r);
                      const color = RESULT_COLOR[r] as "green" | "blue" | "red";
                      return (
                        <div key={r} className="rg-sumcard">
                          <Pill color={color}>{RESULT_LABEL[r]}</Pill>
                          <span className="rg-sumcard__value">{count}</span>
                          <span className="rg-small rg-muted">
                            {pct}% of devices,{" "}
                            {r === "resellable"
                              ? "sample records"
                              : r === "recycle"
                              ? "sample records"
                              : "sample records"}
                          </span>
                          <div className="rg-sumbar">
                            <div
                              className={`rg-sumbar__fill rg-sumbar__fill--${color}`}
                              style={{ width: `${Math.min(pct * 1.4, 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </section>
            </div>


          </div>

          {/* Audit log */}
          <section className="rg-card rg-card--pad">
            <h3>Audit log</h3>
            <p className="rg-small rg-muted">
              Newest first. Select a row to see the full readings for that device.
            </p>

            {/* Toolbar */}
            <div className="rg-toolbar">
              <div className="rg-tabs" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    className={`rg-tab${tab === t.id ? " rg-tab--active" : ""}`}
                    role="tab"
                    aria-selected={tab === t.id}
                    onClick={() => setTab(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="rg-row rg-row--gap8">
                <label className="rg-search" htmlFor="audit-search">
                  <SearchIcon />
                  <input
                    id="audit-search"
                    placeholder="Search device ID"
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
                    <th>Brand</th>
                    <th>Model</th>
                    <th>Time</th>
                    <th>ESR</th>
                    <th>Power draw</th>
                    <th>Temp rise</th>
                    <th>Swell</th>
                    <th>Diagnostic result</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d) => {
                    const isSelected = d.id === selected.id;
                    const resultColor = RESULT_COLOR[d.diagnosticResult] as
                      | "green"
                      | "blue"
                      | "red";
                    return (
                      <tr
                        key={d.id}
                        className={`rg-row-clickable${
                          isSelected ? " rg-row-selected" : ""
                        }`}
                        onClick={() => setSelectedId(d.id)}
                      >
                        <td>
                          <span className="rg-row rg-row--gap6">
                            {d.hasWarning && (
                              <span className="rg-warn-icon">
                                <WarnIcon size={14} />
                              </span>
                            )}
                            <strong>{d.id}</strong>
                          </span>
                        </td>
                        <td>{d.brand}</td>
                        <td>{d.model}</td>
                        <td>{d.time}</td>
                        <td>{d.esr}</td>
                        <td>{d.powerDraw}</td>
                        <td>{d.tempRise}</td>
                        <td>{d.swell}</td>
                        <td>
                          <Pill color={resultColor}>
                            {RESULT_LABEL[d.diagnosticResult]}
                          </Pill>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>


    </div>
  );
}

export default DashboardPage;
