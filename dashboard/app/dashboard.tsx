"use client";

import "./globals.css";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { ReadingCard } from "./components/ReadingCard";
import {
  CheckIcon,
  ClockIcon,
  WarnIcon,
  SearchIcon,
  SortIcon,
} from "./components/Icons";
import { DEVICES } from "@/lib/rg-data";
import {
  RESULT_LABEL,
  RESULT_COLOR,
  DECISION_LABEL,
  DECISION_BIN,
  filterDevices,
  countTestedToday,
  countAwaiting,
  countResellable,
  countSafetyAlerts,
  countRouted,
  countByResult,
  pctByResult,
  fmtDate,
  type AuditTab,
} from "@/lib/rg-helpers";
import type {
  Device,
  DiagnosticResult,
  ProcessingDecision,
} from "@/lib/rg-types";

const TABS: { id: AuditTab; label: string }[] = [
  { id: "all", label: "All devices" },
  { id: "resellable", label: "Resellable" },
  { id: "recycle", label: "Recycle" },
  { id: "disposal", label: "Disposal" },
  { id: "awaiting", label: "Needs verification" },
];

function OverrideModal({
  device,
  onClose,
  onConfirm,
}: {
  device: Device;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  return (
    <div
      className="rg-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Override decision"
    >
      <div className="rg-modal">
        <h3>Override decision</h3>
        <p className="rg-modal__sub">
          Overriding the automated result for <strong>{device.id}</strong>. Provide a reason before continuing.
        </p>
        <label className="rg-modal__label" htmlFor="override-reason">
          Reason for override
        </label>
        <textarea
          id="override-reason"
          className="rg-modal__textarea"
          placeholder="e.g. Physical inspection shows battery in good condition"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <div className="rg-modal__actions">
          <button className="rg-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            className="rg-btn rg-btn--primary"
            disabled={reason.trim().length < 5}
            onClick={() => onConfirm(reason)}
          >
            Confirm override
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>(DEVICES);
  const [selectedId, setSelectedId] = useState<string>(DEVICES[0].id);
  const [tab, setTab] = useState<AuditTab>("all");
  const [query, setQuery] = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [overrideDevice, setOverrideDevice] = useState<Device | null>(null);

  const selected = devices.find((d) => d.id === selectedId) ?? devices[0];

  const totalTested = countTestedToday(devices);
  const awaitingCount = countAwaiting(devices);
  const routedCount = countRouted(devices);
  const resellableCount = countResellable(devices);
  const alertCount = countSafetyAlerts(devices);
  const resellPct = pctByResult(devices, "resellable");

  const filteredDevices = useMemo(
    () => filterDevices(devices, tab, query, sortNewest),
    [devices, tab, query, sortNewest]
  );

  function handleVerify() {
    const bin = DECISION_BIN[selected.diagnosticResult];
    setDevices((prev) =>
      prev.map((d) =>
        d.id === selected.id ? { ...d, processingDecision: bin } : d
      )
    );
  }

  function handleOverrideConfirm(_reason: string) {
    setOverrideDevice(null);
    setDevices((prev) =>
      prev.map((d) =>
        d.id === selected.id
          ? { ...d, processingDecision: DECISION_BIN[d.diagnosticResult] }
          : d
      )
    );
  }

  const today = fmtDate(new Date());

  return (
    <div className="rg-shell">
      <TopNav alertCount={alertCount} />
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
              <button className="rg-btn">Export report</button>
              <button
                className="rg-btn rg-btn--primary"
                onClick={() => router.push("/diagnostics")}
              >
                ＋ New diagnostic test
              </button>
            </div>
          </div>

          {/* Safety alert banner */}
          {alertCount > 0 && (
            <section className="rg-alert-banner" role="alert">
              <span className="rg-alert-banner__icon">
                <WarnIcon size={20} />
              </span>
              <div className="rg-alert-banner__body">
                <strong>Safety alert: battery swelling on REG-20261013-004</strong>
                <p>
                  Wear gloves and move the device to the quarantine shelf. Do not charge it.
                </p>
              </div>
              <button
                className="rg-btn"
                onClick={() => router.push("/safety-alerts")}
              >
                Review alert
              </button>
            </section>
          )}

          {/* KPI cards */}
          <section className="rg-kpi-grid" aria-label="Today's KPIs">
            <div className="rg-kpi rg-kpi--hero">
              <span className="rg-kpi__label">Tested today</span>
              <span className="rg-kpi__value">{totalTested}</span>
              <span className="rg-kpi__sub">
                {routedCount} routed, {awaitingCount} awaiting verification
              </span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Awaiting verification</span>
              <span className="rg-kpi__value">{awaitingCount}</span>
              <span className="rg-kpi__sub">Diagnosed, not yet routed</span>
            </div>
            <div className="rg-kpi">
              <span className="rg-kpi__label">Resellable / Refurbishable</span>
              <span className="rg-kpi__value">{resellableCount}</span>
              <span className="rg-kpi__sub">
                {resellPct}% of devices tested today
              </span>
            </div>
            <div className="rg-kpi rg-kpi--danger">
              <span className="rg-kpi__label">Safety alerts</span>
              <span className="rg-kpi__value">{alertCount}</span>
              <span className="rg-kpi__sub">Needs immediate review</span>
            </div>
          </section>

          {/* Middle grid: device detail + decision */}
          <div className="rg-mid-grid">
            <div className="rg-mid-left">
              {/* Device detail */}
              <section className="rg-card rg-card--pad">
                <div className="rg-row rg-row--between">
                  <div>
                    <h3 className="rg-device-id">{selected.id}</h3>
                    <p className="rg-small rg-muted">
                      Smartphone, {selected.model} (placeholder),{" "}
                      {selected.nominalWeight} g nominal
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
                    { label: "Grade", done: true },
                    {
                      label: "Sort: awaiting verification",
                      done: selected.processingDecision !== "awaiting",
                    },
                    { label: "Report", done: false },
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
                              ? "Bin A"
                              : r === "recycle"
                              ? "Bin B"
                              : "Bin C"}
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

            {/* Decision panel */}
            <aside className="rg-card rg-card--pad rg-decision-panel">
              <h3>Decision</h3>
              <p className="rg-small rg-muted">
                The diagnostic result is a suggestion. The processing decision is final only after verification.
              </p>

              <div className="rg-box rg-box--white">
                <div className="rg-row rg-row--between rg-row--full">
                  <strong>Diagnostic result</strong>
                  <span className="rg-tag">Automated</span>
                </div>
                <Pill
                  color={
                    RESULT_COLOR[selected.diagnosticResult] as
                      | "green"
                      | "blue"
                      | "red"
                  }
                >
                  {RESULT_LABEL[selected.diagnosticResult]}
                </Pill>
                <p className="rg-body">
                  {selected.diagnosticResult === "resellable"
                    ? "All readings are inside their limits. Temperature rise is close to the 15 °C limit, so check the casing before listing."
                    : selected.diagnosticResult === "recycle"
                    ? "One or more readings exceed the resellable threshold. Safe for dismantling."
                    : "Multiple readings exceed safe limits. Route to Bin C immediately."}
                </p>
              </div>

              <div className="rg-box rg-box--grey">
                <div className="rg-row rg-row--between rg-row--full">
                  <strong>Processing decision</strong>
                  <span className="rg-small rg-muted">
                    {selected.processingDecision === "awaiting"
                      ? "Needs operator"
                      : "Verified"}
                  </span>
                </div>
                {selected.processingDecision === "awaiting" ? (
                  <Pill color="amber">Awaiting verification</Pill>
                ) : (
                  <Pill color="green">
                    {
                      DECISION_LABEL[
                        selected.processingDecision as Exclude<
                          ProcessingDecision,
                          "awaiting"
                        >
                      ]
                    }
                  </Pill>
                )}
                <p className="rg-body">
                  {selected.processingDecision === "awaiting"
                    ? "Not yet verified. Confirm the result to route this device to Bin A, or override it with a reason."
                    : `Verified and routed to ${
                        DECISION_LABEL[
                          selected.processingDecision as Exclude<
                            ProcessingDecision,
                            "awaiting"
                          >
                        ]
                      }.`}
                </p>
                {selected.processingDecision === "awaiting" && (
                  <div className="rg-row rg-row--gap8">
                    <button
                      className="rg-btn rg-btn--primary"
                      onClick={handleVerify}
                    >
                      Verify and route
                    </button>
                    <button
                      className="rg-btn"
                      onClick={() => setOverrideDevice(selected)}
                    >
                      Override
                    </button>
                  </div>
                )}
              </div>
            </aside>
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
                    <th>Processing decision</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDevices.map((d) => {
                    const isSelected = d.id === selected.id;
                    const resultColor = RESULT_COLOR[d.diagnosticResult] as
                      | "green"
                      | "blue"
                      | "red";
                    const isAwaiting = d.processingDecision === "awaiting";
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
                        <td>
                          {isAwaiting ? (
                            <Pill color="amber">Awaiting verification</Pill>
                          ) : (
                            <span className="rg-row rg-row--gap6">
                              <CheckIcon size={14} />
                              {
                                DECISION_LABEL[
                                  d.processingDecision as Exclude<
                                    ProcessingDecision,
                                    "awaiting"
                                  >
                                ]
                              }
                            </span>
                          )}
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

      {overrideDevice && (
        <OverrideModal
          device={overrideDevice}
          onClose={() => setOverrideDevice(null)}
          onConfirm={handleOverrideConfirm}
        />
      )}
    </div>
  );
}

export default DashboardPage;
