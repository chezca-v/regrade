"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { Pill } from "./components/Pill";
import { ReadingCard } from "./components/ReadingCard";
import { CheckIcon, ClockIcon } from "./components/Icons";
import { STAGES, CURRENT_READINGS, GRADING_RULES } from "@/lib/rg-data";
import { RESULT_COLOR } from "@/lib/rg-helpers";
import { createClient } from "@/lib/supabase/client";
import type { Stage } from "@/lib/rg-types";

type Telemetry = {
  telemetry_id: number;
  station_id: string;
  session_id: string;
  status: string;
  duration_ms: number | null;
  readings: import("@/lib/database.types").Json;
  grade: "A" | "B" | "C" | "D" | null;
  health_score: number | null;
  fault: string | null;
  reported_at: string;
};

type PhoneReference = { model_id: number; brand: string; model_name: string; baseline_weight_g: number; baseline_thickness_mm: number | null };
type DiagnosticsPageProps = { telemetry: Telemetry[]; telemetryError: boolean; references: PhoneReference[] };

export function DiagnosticsPage({ telemetry, telemetryError, references }: DiagnosticsPageProps) {
  const router = useRouter();
  const stages: Stage[] = STAGES;
  const [activeReport, setActiveReport] = useState<Telemetry | null>(null);
  const [savedReports, setSavedReports] = useState<number[]>([]);
  const [referenceId, setReferenceId] = useState("");
  const [operatorDecision, setOperatorDecision] = useState<"resellable" | "recycle" | "disposal" | "needs-review">("needs-review");
  const [saveMessage, setSaveMessage] = useState("");
  const selectedReference = references.find((item) => String(item.model_id) === referenceId);

  useEffect(() => {
    try {
      const existing = JSON.parse(localStorage.getItem("regrade-saved-diagnoses-v1") ?? "[]") as Telemetry[];
      setSavedReports(existing.map((item) => item.telemetry_id));
    } catch {
      localStorage.removeItem("regrade-saved-diagnoses-v1");
    }
  }, []);

  async function saveReportLocally(report: Telemetry) {
    setSaveMessage("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSaveMessage("Sign in to save this diagnosis to the shared records.");
        return;
      }
      const { error } = await supabase.from("operator_diagnosis").upsert({
        telemetry_id: report.telemetry_id,
        operator_id: user.id,
        device_model_id: selectedReference?.model_id ?? null,
        decision: operatorDecision,
        notes: report.fault,
      }, { onConflict: "telemetry_id,operator_id" });
      if (error) throw error;
      setSavedReports((current) => current.includes(report.telemetry_id) ? current : [...current, report.telemetry_id]);
      localStorage.setItem("regrade-saved-diagnoses-v1", JSON.stringify([{ ...report }, ...((JSON.parse(localStorage.getItem("regrade-saved-diagnoses-v1") ?? "[]") as Telemetry[]).filter((item) => item.telemetry_id !== report.telemetry_id))]));
      setSaveMessage("Diagnosis saved to shared records.");
      return;
    } catch (error) {
      setSaveMessage(error instanceof Error ? `${error.message} A browser copy was saved instead.` : "Shared save is unavailable. A browser copy was saved instead.");
    }
    try {
      const key = "regrade-saved-diagnoses-v1";
      const existing = JSON.parse(localStorage.getItem(key) ?? "[]") as Telemetry[];
      const next = [report, ...existing.filter((item) => item.telemetry_id !== report.telemetry_id)];
      localStorage.setItem(key, JSON.stringify(next));
      setSavedReports((current) => current.includes(report.telemetry_id) ? current : [...current, report.telemetry_id]);
    } catch {
      window.alert("This browser could not save the diagnosis copy. The station report remains in Supabase.");
    }
  }

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <section className="rg-card rg-card--pad">
            <h2>Latest station readings</h2>
            <p className="rg-small rg-muted">Live MQTT reports saved in Supabase. This section refreshes when you reload the page.</p>
            {telemetryError ? (
              <p className="rg-small">Could not load station reports. Confirm the public telemetry migration is applied and the dashboard points to the same Supabase project.</p>
            ) : telemetry.length === 0 ? (
              <p className="rg-small">No station reports have arrived yet.</p>
            ) : (
              <div className="rg-table-wrap">
                <table className="rg-rules-table">
                  <thead><tr><th>Received</th><th>Station</th><th>Session</th><th>Status</th><th>Grade</th><th>Health</th><th>Weight (g)</th><th>Thickness (mm)</th><th>Current (mA)</th><th>Surface temp (°C)</th><th>Temp rise (°C)</th><th></th></tr></thead>
                  <tbody>
                    {telemetry.map((record) => {
                      const readings = record.readings && typeof record.readings === "object" && !Array.isArray(record.readings)
                        ? record.readings as Record<string, import("@/lib/database.types").Json | undefined>
                        : {};
                      const display = (key: string) => {
                        const value = readings[key];
                        return typeof value === "number" ? value.toFixed(2) : "—";
                      };
                      return <tr key={record.telemetry_id}>
                        <td>{new Date(record.reported_at).toISOString().replace("T", " ").slice(0, 19)} UTC</td><td>{record.station_id}</td><td>{record.session_id}</td><td>{record.status}</td>
                        <td>{record.grade ?? "—"}</td><td>{record.health_score !== null ? `${record.health_score}%` : "—"}</td>
                        <td>{display("weight_g")}</td><td>{display("thickness_mm")}</td><td>{display("current_ma")}</td><td>{display("surface_temp_c")}</td><td>{display("temperature_rise_c")}</td>
                        <td><button type="button" className="rg-btn" onClick={() => setActiveReport(record)}>Review result</button></td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          {/* Title bar */}
          <div className="rg-titlebar">
            <div>
              <h1>Diagnostics</h1>
              <p className="rg-sub">
                Station reports, grading reference, and the next operator step. No station hardware is connected to this demo.
              </p>
            </div>
            <div className="rg-titlebar__actions">
              <button
                className="rg-btn"
                onClick={() => router.push("/diagnostics/reference-weights")}
              >
                View reference weights
              </button>
              <button className="rg-btn rg-btn--primary" disabled title="Connect the ESP32 station before starting a real test.">
                Station offline
              </button>
            </div>
          </div>

          {/* Current test card */}
          <section className="rg-card rg-card--pad rg-current-test">
            <div className="rg-row rg-row--between rg-current-test__header">
              <div>
                <h3>Single-device test workflow</h3>
                <p className="rg-small rg-muted">
                  One closed phone at a time. Place it on the station and press the physical START button; the report appears above after the station sends it.
                </p>
              </div>
              <span className="rg-badge rg-badge--neutral">
                Waiting for station report
              </span>
            </div>

            {/* 5-step stepper */}
            <div
              className="rg-stages-grid"
              role="list"
              aria-label="Diagnostic test stages"
            >
              {stages.map((stage) => {
                const isDone = stage.state === "done";
                const isActive = stage.state === "active";
                return (
                  <div
                    key={stage.label}
                    role="listitem"
                    className={`rg-stage-card${
                      isDone
                        ? " rg-stage-card--done"
                        : isActive
                        ? " rg-stage-card--active"
                        : ""
                    }`}
                  >
                    <div className="rg-stage-card__icon">
                      {isDone ? (
                        <CheckIcon size={16} />
                      ) : (
                        <ClockIcon size={16} />
                      )}
                    </div>
                    <div className="rg-stage-card__text">
                      <strong className="rg-stage-card__label">
                        {stage.label}
                      </strong>
                      <span className="rg-stage-card__sub">{stage.sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 4 readings cards */}
            <div className="rg-readings-grid">
              {CURRENT_READINGS.map((reading) => (
                <ReadingCard key={reading.label} reading={reading} />
              ))}
            </div>
            <p className="rg-small rg-muted">Illustrative sample only. No live scan is in progress.</p>
          </section>

          {/* Grading reference and single-device next step */}
          <div className="rg-diag-split rg-diag-split--rules-only">
            {/* Left: How each result is graded */}
            <section className="rg-card rg-card--pad rg-diag-split__rules">
              <h3>How each result is graded</h3>
              <p className="rg-small rg-muted">
                The diagnostic result is a screening guide. An operator reviews each single-device result.
              </p>

              <div className="rg-table-wrap">
                <table className="rg-rules-table">
                  <thead>
                    <tr>
                      <th>Classification</th>
                      <th>Weight</th>
                      <th>Casing swell</th>
                      <th>Temp rise</th>
                      <th>Charging draw</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRADING_RULES.map((rule) => {
                      const color = RESULT_COLOR[rule.resultKey] as
                        | "green"
                        | "blue"
                        | "red";
                      return (
                        <tr key={rule.resultKey}>
                          <td>
                            <Pill color={color}>{rule.label}</Pill>
                          </td>
                          <td>{rule.weight}</td>
                          <td>{rule.swell}</td>
                          <td>{rule.tempRise}</td>
                          <td>{rule.chargeDraw}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="rg-rules-footnote">
                Battery ESR limits are placeholders until the team confirms them.
              </p>
              <div className="rg-next-step-note">
                <strong>Next: complete one scan at the station</strong>
                <span>Place one closed phone on the bed, press the physical START button, then review the result in Latest station readings. Any station fault is surfaced with that result.</span>
                <button className="rg-btn" type="button" onClick={() => router.push("/diagnostics/reference-weights")}>Compare with phone references</button>
              </div>
            </section>


          </div>
        </div>
      </main>
      {activeReport && (
        <div className="rg-modal-backdrop" role="presentation" onClick={() => setActiveReport(null)}>
          <section className="rg-modal rg-result-modal" role="dialog" aria-modal="true" aria-labelledby="diagnostic-result-heading" onClick={(event) => event.stopPropagation()}>
            <div className="rg-row rg-row--between">
              <div>
                <h2 id="diagnostic-result-heading">Scan result</h2>
                <p className="rg-modal__sub">Session {activeReport.session_id} · {new Date(activeReport.reported_at).toLocaleString()}</p>
              </div>
              <button className="rg-btn" type="button" onClick={() => setActiveReport(null)}>Close</button>
            </div>
            {(activeReport.grade === "D" || activeReport.fault) && (
              <div className="rg-alert-banner rg-result-warning" role="alert">
                <strong>Station safety flag</strong>
                <span>{activeReport.fault ?? "Grade D reported. Stop handling and follow the approved safety procedure."}</span>
              </div>
            )}
            <div className="rg-result-summary">
              <div><span>Station status</span><strong>{activeReport.status}</strong></div>
              <div><span>Grade</span><strong>{activeReport.grade ?? "Not reported"}</strong></div>
              <div><span>Health score</span><strong>{activeReport.health_score === null ? "Not reported" : `${activeReport.health_score}%`}</strong></div>
              <div><span>Device identification</span><strong>Brand and model not sent by station</strong></div>
            </div>
            <h3>Measured readings</h3>
            <div className="rg-result-readings">
              {activeReport.readings && typeof activeReport.readings === "object" && !Array.isArray(activeReport.readings) ? Object.entries(activeReport.readings).map(([key, value]) => (
                <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{typeof value === "number" || typeof value === "string" ? value : "Not reported"}</strong></div>
              )) : <p className="rg-small rg-muted">No readings were included in this station report.</p>}
            </div>
            <div className="rg-reference-compare">
              <label htmlFor="scan-reference-model"><strong>Compare with a healthy phone reference</strong></label>
              <select id="scan-reference-model" value={referenceId} onChange={(event) => setReferenceId(event.target.value)}>
                <option value="">Select brand and model</option>
                {references.map((item) => <option key={item.model_id} value={item.model_id}>{item.brand} {item.model_name}</option>)}
              </select>
              {selectedReference && (() => {
                const readings = activeReport.readings && typeof activeReport.readings === "object" && !Array.isArray(activeReport.readings) ? activeReport.readings as Record<string, import("@/lib/database.types").Json | undefined> : {};
                const measuredWeight = typeof readings.weight_g === "number" ? readings.weight_g : null;
                const measuredThickness = typeof readings.thickness_mm === "number" ? readings.thickness_mm : null;
                return <div className="rg-reference-compare__values">
                  <span>Weight: scanned {measuredWeight === null ? "not reported" : `${measuredWeight} g`} · reference {selectedReference.baseline_weight_g} g</span>
                  <span>Thickness: scanned {measuredThickness === null ? "not reported" : `${measuredThickness} mm`} · reference {selectedReference.baseline_thickness_mm == null ? "not recorded" : `${selectedReference.baseline_thickness_mm} mm`}</span>
                </div>;
              })()}
              <p className="rg-small rg-muted">Brand and model are operator-selected; the station does not identify phones automatically.</p>
            </div>
            <label className="rg-decision-select">Operator disposition
              <select value={operatorDecision} onChange={(event) => setOperatorDecision(event.target.value as typeof operatorDecision)}>
                <option value="needs-review">Needs more review</option>
                <option value="resellable">Suitable for reuse review</option>
                <option value="recycle">Recycle / safe dismantling review</option>
                <option value="disposal">Disposal review</option>
              </select>
            </label>
            <p className="rg-small rg-muted">The station report is stored in Supabase. Save a reviewed operator disposition with the selected model reference. Results are screening indicators and do not confirm battery safety.</p>
            {saveMessage && <p className="rg-small" role="status">{saveMessage} {saveMessage.startsWith("Sign in") && <Link href="/login">Sign in</Link>}</p>}
            <div className="rg-modal__actions">
              <button className="rg-btn" type="button" onClick={() => router.push("/diagnostics/reference-weights")}>Compare phone references</button>
              <button className="rg-btn rg-btn--primary" type="button" onClick={() => void saveReportLocally(activeReport)}>{savedReports.includes(activeReport.telemetry_id) ? "Diagnosis saved" : "Save diagnosis"}</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DiagnosticsPage;
