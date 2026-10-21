"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/lib/database.types";

type Telemetry = {
  telemetry_id: number;
  station_id: string;
  session_id: string;
  status: string;
  duration_ms: number | null;
  readings: Json;
  grade: "A" | "B" | "C" | "D" | null;
  health_score: number | null;
  fault: string | null;
  reported_at: string;
};

type PhoneReference = {
  model_id: number;
  brand: string;
  model_name: string;
  baseline_weight_g: number;
  baseline_thickness_mm: number | null;
};

type DiagnosticsPageProps = {
  telemetry: Telemetry[];
  telemetryError: boolean;
  referenceError: boolean;
  savedReviewError: boolean;
  references: PhoneReference[];
  savedTelemetryIds: number[];
};

function readingsFor(report: Telemetry): Record<string, Json | undefined> {
  return report.readings !== null && typeof report.readings === "object" && !Array.isArray(report.readings)
    ? report.readings
    : {};
}

function hasStableReadings(report: Telemetry) {
  return readingsFor(report).stable === true;
}

export function DiagnosticsPage({ telemetry, telemetryError, referenceError, savedReviewError, references, savedTelemetryIds }: DiagnosticsPageProps) {
  const router = useRouter();
  const [activeReport, setActiveReport] = useState<Telemetry | null>(null);
  const [savedReports, setSavedReports] = useState(savedTelemetryIds);
  const [referenceId, setReferenceId] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [newDiagnosticOpen, setNewDiagnosticOpen] = useState(false);
  const [pendingScan, setPendingScan] = useState<{ startedAt: string; referenceId: string } | null>(null);
  const [scanMessage, setScanMessage] = useState("");
  const [operatorDecision, setOperatorDecision] = useState<"resellable" | "recycle" | "disposal" | "needs-review">("needs-review");
  const [saveMessage, setSaveMessage] = useState("");
  const selectedReference = references.find((item) => String(item.model_id) === referenceId);
  const chosenReference = references.find(
    (item) => `${item.brand} ${item.model_name}`.toLowerCase() === referenceSearch.trim().toLowerCase(),
  );

  useEffect(() => {
    if (!pendingScan) return;
    const supabase = createClient();
    const interval = window.setInterval(async () => {
      if (Date.now() - new Date(pendingScan.startedAt).getTime() > 60_000) {
        setPendingScan(null);
        setScanMessage("No report arrived within one minute. Check the ESP32, MQTT listener, broker, and Supabase connection, then try again.");
        return;
      }
      const { data, error } = await supabase
        .from("station_telemetry")
        .select("telemetry_id, station_id, session_id, status, duration_ms, readings, grade, health_score, fault, reported_at")
        .gt("reported_at", pendingScan.startedAt)
        .order("reported_at", { ascending: false })
        .limit(1);
      if (error) {
        setScanMessage(`Could not check for a station report: ${error.message}`);
        return;
      }
      const report = data?.[0];
      if (!report) return;
      setReferenceId(pendingScan.referenceId);
      setActiveReport(report);
      setPendingScan(null);
      setScanMessage(hasStableReadings(report)
        ? "Stable station readings received."
        : "A report arrived, but stability was not confirmed. Sensor values are hidden.");
      router.refresh();
    }, 1500);
    return () => window.clearInterval(interval);
  }, [pendingScan, router]);

  function beginDiagnostic() {
    if (!chosenReference) return;
    setReferenceId(String(chosenReference.model_id));
    setScanMessage("Ready. Place one closed phone on the station, then press its physical START button.");
    setPendingScan({ startedAt: new Date().toISOString(), referenceId: String(chosenReference.model_id) });
    setNewDiagnosticOpen(false);
  }

  async function saveDiagnosis(report: Telemetry) {
    setSaveMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        setSaveMessage("Sign in to save this diagnosis to shared records.");
        return;
      }
      if (!selectedReference) {
        setSaveMessage("Select a saved phone reference before saving.");
        return;
      }
      if (!hasStableReadings(report)) {
        setSaveMessage("This report has no stability-confirmed readings and cannot be saved as a diagnosis.");
        return;
      }
      const { error } = await supabase.from("operator_diagnosis").upsert({
        telemetry_id: report.telemetry_id,
        operator_id: user.id,
        device_model_id: selectedReference.model_id,
        decision: operatorDecision,
        notes: report.fault,
      }, { onConflict: "telemetry_id,operator_id" });
      if (error) throw error;
      setSavedReports((current) => current.includes(report.telemetry_id) ? current : [...current, report.telemetry_id]);
      setSaveMessage("Diagnosis and phone reference saved to Supabase.");
      router.refresh();
    } catch (error) {
      setSaveMessage(error instanceof Error ? `Could not save diagnosis: ${error.message}` : "Could not save diagnosis.");
    }
  }

  function stableValue(report: Telemetry, key: string) {
    if (!hasStableReadings(report)) return "—";
    const value = readingsFor(report)[key];
    return typeof value === "number" ? value.toFixed(2) : "—";
  }

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div><h1>Diagnostics</h1><p className="rg-sub">Select a phone reference, use the station’s physical START button, then review confirmed readings.</p></div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn" onClick={() => router.push("/diagnostics/reference-weights")}>Phone references</button>
              <button className="rg-btn rg-btn--primary" disabled={Boolean(pendingScan)} onClick={() => { setReferenceSearch(""); setNewDiagnosticOpen(true); }}>New diagnostic</button>
            </div>
          </div>

          {scanMessage && <p className="rg-small" role="status">{scanMessage}</p>}
          {pendingScan && <p className="rg-small" role="status">Waiting for a new station report. The hardware scan is limited to 15 seconds and only reports stable readings when calibrated tolerances pass.</p>}
          {referenceError && <p className="rg-small" role="alert">Could not load phone references. Check the Supabase project and apply the phone-reference migration after reviewing pending migrations.</p>}
          {savedReviewError && <p className="rg-small" role="alert">Could not load saved review status. Check the operator-diagnosis migration and your sign-in session.</p>}

          <section className="rg-card rg-card--pad">
            <h2>Latest station readings</h2>
            <p className="rg-small rg-muted">Reports are read from Supabase. Refresh to load reports received outside this workflow.</p>
            {telemetryError ? <p className="rg-small">Could not load reports. Confirm the telemetry migration and dashboard Supabase project.</p> : telemetry.length === 0 ? <p className="rg-small">No station reports have arrived yet.</p> : (
              <div className="rg-table-wrap">
                <table className="rg-rules-table">
                  <thead><tr><th>Received</th><th>Station</th><th>Session</th><th>Status</th><th>Stable</th><th>Grade</th><th>Weight (g)</th><th>Thickness (mm)</th><th>Current (mA)</th><th>Temp rise (°C)</th><th></th></tr></thead>
                  <tbody>{telemetry.map((record) => <tr key={record.telemetry_id}>
                    <td>{new Date(record.reported_at).toLocaleString()}</td><td>{record.station_id}</td><td>{record.session_id}</td><td>{record.status}</td>
                    <td>{hasStableReadings(record) ? "Yes" : "No"}</td><td>{hasStableReadings(record) ? record.grade ?? "—" : "—"}</td>
                    <td>{stableValue(record, "weight_g")}</td><td>{stableValue(record, "thickness_mm")}</td><td>{stableValue(record, "current_ma")}</td><td>{stableValue(record, "temperature_rise_c")}</td>
                    <td><button type="button" className="rg-btn" onClick={() => { setReferenceId(""); setActiveReport(record); }}>Review result</button></td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rg-card rg-card--pad">
            <h3>How to run a scan</h3>
            <ol>
              <li>Select a saved phone reference with <strong>New diagnostic</strong>.</li>
              <li>Place one closed phone on the assembled station and press its physical <strong>START</strong> button.</li>
              <li>The station samples for up to 15 seconds. Readings are shown only after calibrated stability tolerances pass.</li>
              <li>Review the report, choose an operator disposition, and save it to Supabase. Saved records appear in Overview, Inventory, and Reports.</li>
            </ol>
            <p className="rg-small rg-muted">Grading thresholds and sorter actuation remain disabled. These external measurements do not determine battery-cell condition or prove device safety.</p>
          </section>
        </div>
      </main>

      {newDiagnosticOpen && (
        <div className="rg-modal-backdrop" role="presentation" onClick={() => setNewDiagnosticOpen(false)}>
          <section className="rg-modal" role="dialog" aria-modal="true" aria-labelledby="new-diagnostic-heading" onClick={(event) => event.stopPropagation()}>
            <div className="rg-row rg-row--between"><div><h2 id="new-diagnostic-heading">New diagnostic</h2><p className="rg-modal__sub">Choose the phone reference before sensing starts.</p></div><button className="rg-btn" type="button" onClick={() => setNewDiagnosticOpen(false)}>Close</button></div>
            <label className="rg-decision-select" htmlFor="new-diagnostic-reference">Phone brand and model</label>
            <input id="new-diagnostic-reference" className="rg-diagnostic-reference-input" list="phone-reference-options" value={referenceSearch} onChange={(event) => setReferenceSearch(event.target.value)} placeholder="Search saved phone references" autoComplete="off" />
            <datalist id="phone-reference-options">{references.map((item) => <option key={item.model_id} value={`${item.brand} ${item.model_name}`} />)}</datalist>
            {chosenReference ? <p className="rg-small rg-muted">Saved reference: {chosenReference.baseline_weight_g} g{chosenReference.baseline_thickness_mm === null ? "" : ` · ${chosenReference.baseline_thickness_mm} mm`}</p> : <p className="rg-small rg-muted">Choose an existing reference, or <Link href="/diagnostics/reference-weights">add a phone reference</Link> first.</p>}
            <p className="rg-small rg-muted">This begins the dashboard workflow; it does not remotely start the ESP32. After continuing, press the physical START button at the station.</p>
            <div className="rg-modal__actions"><button className="rg-btn rg-btn--primary" type="button" disabled={!chosenReference} onClick={beginDiagnostic}>Continue to station</button></div>
          </section>
        </div>
      )}

      {activeReport && (
        <div className="rg-modal-backdrop" role="presentation" onClick={() => setActiveReport(null)}>
          <section className="rg-modal rg-result-modal" role="dialog" aria-modal="true" aria-labelledby="diagnostic-result-heading" onClick={(event) => event.stopPropagation()}>
            <div className="rg-row rg-row--between"><div><h2 id="diagnostic-result-heading">Scan result</h2><p className="rg-modal__sub">Session {activeReport.session_id} · {new Date(activeReport.reported_at).toLocaleString()}</p></div><button className="rg-btn" type="button" onClick={() => setActiveReport(null)}>Close</button></div>
            {activeReport.fault && <div className="rg-alert-banner rg-result-warning" role="alert"><strong>Station reported a fault</strong><span>{activeReport.fault}</span></div>}
            {!selectedReference && <label className="rg-decision-select">Phone reference<select value={referenceId} onChange={(event) => setReferenceId(event.target.value)}><option value="">Select a saved brand and model</option>{references.map((item) => <option key={item.model_id} value={item.model_id}>{item.brand} {item.model_name}</option>)}</select></label>}
            <div className="rg-result-summary">
              <div><span>Station status</span><strong>{activeReport.status}</strong></div>
              <div><span>Stability</span><strong>{hasStableReadings(activeReport) ? "Confirmed" : "Not confirmed"}</strong></div>
              <div><span>Firmware grade</span><strong>{hasStableReadings(activeReport) ? activeReport.grade ?? "Not produced" : "Not available"}</strong></div>
              <div><span>Phone reference</span><strong>{selectedReference ? `${selectedReference.brand} ${selectedReference.model_name}` : "Select a reference"}</strong></div>
            </div>
            <h3>Measured readings</h3>
            {hasStableReadings(activeReport) ? (
              <div className="rg-result-readings">{Object.entries(readingsFor(activeReport)).filter(([key]) => !["stable", "stability_samples", "stability_window_ms"].includes(key)).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{typeof value === "number" || typeof value === "string" ? value : "Not reported"}</strong></div>)}</div>
            ) : <p className="rg-small rg-muted">Stability was not confirmed. Raw sensor readings are hidden; correct sensor or calibration issues and retry.</p>}
            {selectedReference && <div className="rg-reference-compare"><strong>Phone reference: {selectedReference.brand} {selectedReference.model_name}</strong><span>Baseline weight: {selectedReference.baseline_weight_g} g</span><span>Baseline thickness: {selectedReference.baseline_thickness_mm ?? "Not recorded"}</span></div>}
            <label className="rg-decision-select">Operator disposition<select value={operatorDecision} onChange={(event) => setOperatorDecision(event.target.value as typeof operatorDecision)}><option value="needs-review">Needs more review</option><option value="resellable">Suitable for reuse review</option><option value="recycle">Recycle review</option><option value="disposal">Disposal review</option></select></label>
            <p className="rg-small rg-muted">Saved dispositions are operator reviews, not automated safety or recycling classifications.</p>
            {saveMessage && <p className="rg-small" role="status">{saveMessage} {saveMessage.startsWith("Sign in") && <Link href="/login">Sign in</Link>}</p>}
            <div className="rg-modal__actions"><button className="rg-btn rg-btn--primary" type="button" disabled={!hasStableReadings(activeReport) || !selectedReference || savedReports.includes(activeReport.telemetry_id)} onClick={() => void saveDiagnosis(activeReport)}>{savedReports.includes(activeReport.telemetry_id) ? "Diagnosis saved" : "Save diagnosis"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DiagnosticsPage;
