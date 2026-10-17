"use client";

import "./globals.css";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { CheckIcon } from "./components/Icons";
import { ALERTS_INITIAL, HAZARD_STEPS_INITIAL } from "@/lib/rg-data";
import type { SafetyAlert, HazardStep } from "@/lib/rg-types";

export function SafetyAlertsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<SafetyAlert[]>(ALERTS_INITIAL);
  const [steps, setSteps] = useState<HazardStep[]>(HAZARD_STEPS_INITIAL);

  const openCount = alerts.filter((a) => a.status === "open").length;
  const ackCount = alerts.filter((a) => a.status === "acknowledged").length;
  const resCount = alerts.filter((a) => a.status === "resolved").length;

  function handleAcknowledge(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a))
    );
  }

  function handleResolve(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "resolved" } : a))
    );
  }

  function toggleStep(id: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done } : s))
    );
  }

  function handleExport() {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Device,Type,Raised,Status,Description"]
        .concat(
          alerts.map(
            (a) =>
              `"${a.id}","${a.deviceId}","${a.type}","${a.raisedAt}","${a.status}","${a.description.replace(/"/g, '""')}"`
          )
        )
        .join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "regrade-safety-alerts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="rg-shell">
      <TopNav alertCount={openCount} />
      <main className="rg-main">
        <div className="rg-page">
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Safety alerts</h1>
              <p className="rg-sub">
                Hazards raised by diagnostics. Handle open alerts first. Sample data.
              </p>
            </div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn" onClick={handleExport}>
                Export alert log
              </button>
            </div>
          </div>

          {/* KPI row: 3 cards */}
          <section className="rg-alerts-kpis" aria-label="Alert metrics">
            <div className="rg-card rg-card--pad rg-alerts-kpi rg-alerts-kpi--danger">
              <span className="rg-alerts-kpi__label">Open alerts</span>
              <span className="rg-alerts-kpi__value rg-alerts-kpi__value--danger">
                {openCount}
              </span>
              <span className="rg-small rg-muted">Need action now</span>
            </div>
            <div className="rg-card rg-card--pad rg-alerts-kpi rg-alerts-kpi--warn">
              <span className="rg-alerts-kpi__label">Acknowledged</span>
              <span className="rg-alerts-kpi__value rg-alerts-kpi__value--warn">
                {ackCount}
              </span>
              <span className="rg-small rg-muted">Being handled</span>
            </div>
            <div className="rg-card rg-card--pad rg-alerts-kpi rg-alerts-kpi--safe">
              <span className="rg-alerts-kpi__label">Resolved today</span>
              <span className="rg-alerts-kpi__value rg-alerts-kpi__value--safe">
                {resCount}
              </span>
              <span className="rg-small rg-muted">Average response 6 min</span>
            </div>
          </section>

          {/* Main split */}
          <div className="rg-alerts-split">
            {/* Left: Alert list */}
            <section className="rg-alerts-list" aria-label="Active safety alerts">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rg-card rg-card--pad rg-alert-card rg-alert-card--${alert.status}`}
                >
                  <div className="rg-row rg-row--between rg-alert-card__head">
                    <h3 className="rg-alert-card__title">{alert.type}</h3>
                    <span className={`rg-badge rg-badge--alert-${alert.status}`}>
                      {alert.status === "open"
                        ? "Open"
                        : alert.status === "acknowledged"
                        ? "Acknowledged"
                        : "Resolved"}
                    </span>
                  </div>
                  <p className="rg-small rg-muted rg-alert-card__meta">
                    {alert.raisedAt}
                  </p>
                  <p className="rg-alert-card__desc">{alert.description}</p>
                  <div className="rg-row rg-row--gap8 rg-alert-card__actions">
                    {alert.status === "open" && (
                      <button
                        className="rg-btn rg-btn--primary"
                        onClick={() => handleAcknowledge(alert.id)}
                      >
                        Acknowledge
                      </button>
                    )}
                    {alert.status === "acknowledged" && (
                      <button
                        className="rg-btn"
                        onClick={() => handleResolve(alert.id)}
                      >
                        Mark resolved
                      </button>
                    )}
                    <button
                      className="rg-btn"
                      onClick={() =>
                        router.push(`/overview?device=${alert.deviceId}`)
                      }
                    >
                      View device
                    </button>
                  </div>
                </div>
              ))}
            </section>

            {/* Right: Hazard handling steps checklist */}
            <aside className="rg-card rg-card--pad rg-hazard-checklist">
              <h3>Hazard handling steps</h3>
              <p className="rg-small rg-muted">
                Complete before touching a flagged device.
              </p>

              <div className="rg-checklist" role="list">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    role="listitem"
                    tabIndex={0}
                    className={`rg-checklist__item${
                      step.done ? " rg-checklist__item--done" : ""
                    }`}
                    onClick={() => toggleStep(step.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleStep(step.id);
                      }
                    }}
                  >
                    <div
                      className={`rg-checkbox${
                        step.done ? " rg-checkbox--checked" : ""
                      }`}
                      aria-hidden="true"
                    >
                      {step.done && <CheckIcon size={14} />}
                    </div>
                    <span className="rg-checklist__label">{step.label}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

export default SafetyAlertsPage;
