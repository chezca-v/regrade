"use client";

import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { TopNav } from "./components/TopNav";
import { PhoneIcon, ChargerIcon, PlusIcon } from "./components/Icons";
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

type DeviceType = "phone" | "charger";

type DeviceReference = {
  model_id: number;
  brand: string;
  model_name: string;
  device_type: DeviceType;
  baseline_weight_g: number;
  baseline_thickness_mm: number | null;
};

type DiagnosticsPageProps = {
  telemetry: Telemetry[];
  telemetryError: boolean;
  referenceError: boolean;
  savedReviewError: boolean;
  references: DeviceReference[];
  savedTelemetryIds: number[];
};

const SCAN_WINDOW_MS = 15_000;
const SCAN_TIMEOUT_MS = 60_000;
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const SCAN_CAPTIONS = [
  "Reading sensor data…",
  "Please wait, we're almost there…",
  "Checking sensor stability…",
  "Hang tight — just a few more seconds…",
];

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
  const [deviceReferences, setDeviceReferences] = useState(references);
  const [activeReport, setActiveReport] = useState<Telemetry | null>(null);
  const [savedReports, setSavedReports] = useState(savedTelemetryIds);
  const [referenceId, setReferenceId] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [mode, setMode] = useState<DeviceType>("phone");
  const [newDiagnosticOpen, setNewDiagnosticOpen] = useState(false);
  const [addReferenceOpen, setAddReferenceOpen] = useState(false);
  const [addReferenceSaving, setAddReferenceSaving] = useState(false);
  const [addReferenceMessage, setAddReferenceMessage] = useState("");
  const [pendingScan, setPendingScan] = useState<{ startedAt: string; referenceId: string; mode: DeviceType } | null>(null);
  const [scanMessage, setScanMessage] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [operatorDecision, setOperatorDecision] = useState<"resellable" | "recycle" | "disposal" | "needs-review">("needs-review");
  const [saveMessage, setSaveMessage] = useState("");
  const selectedReference = deviceReferences.find((item) => String(item.model_id) === referenceId);
  const referencesForMode = deviceReferences.filter((item) => item.device_type === mode);
  const chosenReference = referencesForMode.find(
    (item) => `${item.brand} ${item.model_name}`.toLowerCase() === referenceSearch.trim().toLowerCase(),
  );

  useEffect(() => {
    if (!pendingScan) return;
    const supabase = createClient();
    const interval = window.setInterval(async () => {
      if (Date.now() - new Date(pendingScan.startedAt).getTime() > SCAN_TIMEOUT_MS) {
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
      setScanMessage(report.status === "stopped_by_operator"
        ? "Scanning was stopped at the station."
        : hasStableReadings(report)
        ? "Stable station readings received."
        : "A report arrived, but stability was not confirmed. Sensor values are hidden.");
      router.refresh();
    }, 1500);
    return () => window.clearInterval(interval);
  }, [pendingScan, router]);

  useEffect(() => {
    if (!pendingScan) return;
    const ticker = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(ticker);
  }, [pendingScan]);

  async function beginDiagnostic() {
    if (!chosenReference) return;
    const chosenReferenceId = String(chosenReference.model_id);
    const deviceWord = mode === "phone" ? "phone" : "charger";
    setReferenceId(chosenReferenceId);
    setPendingScan({ startedAt: new Date().toISOString(), referenceId: chosenReferenceId, mode });
    setNewDiagnosticOpen(false);
    setScanMessage(`Place one closed ${deviceWord} on the station. Sending a wake command...`);

    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError && !isAuthSessionMissingError(userError)) throw userError;
      if (!user) {
        setScanMessage(`Place one closed ${deviceWord} on the station, then press its physical START button. Sign in to wake the station remotely instead.`);
        return;
      }
      const stationId = process.env.NEXT_PUBLIC_STATION_ID ?? "regrade-station-001";
      const { error } = await supabase.from("station_command").insert({
        station_id: stationId,
        command: "start",
        requested_by: user.id,
      });
      if (error) throw error;
      setScanMessage("Wake command sent. The station should start scanning within a few seconds; press its physical START button if it does not.");
    } catch (error) {
      setScanMessage(error instanceof Error
        ? `Could not wake the station remotely: ${error.message}. Press its physical START button instead.`
        : "Could not wake the station remotely. Press its physical START button instead.");
    }
  }

  async function addDeviceReference(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setAddReferenceSaving(true);
    setAddReferenceMessage("");
    const form = new FormData(formElement);
    const brand = String(form.get("brand") ?? "").trim();
    const model = String(form.get("model") ?? "").trim();
    const weight = Number(form.get("weight"));
    const thicknessInput = String(form.get("thickness") ?? "").trim();
    const thickness = thicknessInput ? Number(thicknessInput) : null;
    if (!brand || !model || !Number.isFinite(weight) || weight <= 0 || (thickness !== null && (!Number.isFinite(thickness) || thickness <= 0))) {
      setAddReferenceMessage("Enter a brand, model, positive weight, and a valid optional thickness.");
      setAddReferenceSaving(false);
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError && !isAuthSessionMissingError(userError)) throw userError;
      if (!user) throw new Error("Sign in first to add a shared device reference.");
      const { data, error } = await supabase.from("device_model").insert({
        brand, model_name: model, device_type: mode, baseline_weight_g: weight,
        baseline_thickness_mm: thickness, nominal_current_ma: null, source: "operator-added", created_by: user.id,
      }).select("model_id, brand, model_name, device_type, baseline_weight_g, baseline_thickness_mm").single();
      if (error) throw error;
      setDeviceReferences((current) => [...current, data]);
      setReferenceSearch(`${data.brand} ${data.model_name}`);
      setAddReferenceOpen(false);
      formElement.reset();
    } catch (error) {
      setAddReferenceMessage(error instanceof Error ? error.message : "Could not save this reference.");
    } finally {
      setAddReferenceSaving(false);
    }
  }

  async function saveDiagnosis(report: Telemetry) {
    setSaveMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError && !isAuthSessionMissingError(userError)) throw userError;
      if (!user) {
        setSaveMessage("Sign in to save this diagnosis to shared records.");
        return;
      }
      if (!selectedReference) {
        setSaveMessage("Select a saved device reference before saving.");
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
      setSaveMessage("Diagnosis and device reference saved to Supabase.");
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

  const elapsedMs = pendingScan ? Math.max(0, nowTick - new Date(pendingScan.startedAt).getTime()) : 0;
  const scanIndeterminate = elapsedMs >= SCAN_WINDOW_MS;
  const secondsLeft = Math.max(0, Math.ceil((SCAN_WINDOW_MS - elapsedMs) / 1000));
  const ringOffset = scanIndeterminate ? 0 : RING_CIRCUMFERENCE * (elapsedMs / SCAN_WINDOW_MS);
  const captionIndex = Math.floor(elapsedMs / 3200) % SCAN_CAPTIONS.length;
  const scanModeWord = pendingScan?.mode ?? mode;

  return (
    <div className="rg-shell">
      <TopNav />
      <main className="rg-main">
        <div className="rg-page">
          <div className="rg-titlebar">
            <div><h1>Diagnostics</h1><p className="rg-sub">Choose phone or charger mode, pick a reference, wake the station (or use its physical START button), then review confirmed readings.</p></div>
            <div className="rg-titlebar__actions">
              <button className="rg-btn" onClick={() => router.push("/diagnostics/reference-weights")}>Phone references</button>
              <button className="rg-btn rg-btn--primary" disabled={Boolean(pendingScan)} onClick={() => { setReferenceSearch(""); setNewDiagnosticOpen(true); }}>New diagnostic</button>
            </div>
          </div>

          {scanMessage && <p className="rg-small" role="status">{scanMessage}</p>}
          {referenceError && <p className="rg-small" role="alert">Could not load device references. Check the Supabase project and apply pending migrations.</p>}
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
              <li>Pick <strong>Phone</strong> or <strong>Charger</strong> mode and select (or add) a reference with <strong>New diagnostic</strong>.</li>
              <li>Place one closed device on the assembled station. If you&rsquo;re signed in, continuing sends a wake command to the station; otherwise (or if it doesn&rsquo;t arrive) press its physical <strong>START</strong> button.</li>
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
            <div className="rg-row rg-row--between"><div><h2 id="new-diagnostic-heading">New diagnostic</h2><p className="rg-modal__sub">Choose the device type and reference before sensing starts.</p></div><button className="rg-btn" type="button" onClick={() => setNewDiagnosticOpen(false)}>Close</button></div>

            <div className="rg-mode-toggle" role="radiogroup" aria-label="Device type">
              <button type="button" role="radio" aria-checked={mode === "phone"} className={`rg-mode-toggle__option${mode === "phone" ? " is-active" : ""}`} onClick={() => { setMode("phone"); setReferenceSearch(""); }}>
                <PhoneIcon size={15} /> Phone
              </button>
              <button type="button" role="radio" aria-checked={mode === "charger"} className={`rg-mode-toggle__option${mode === "charger" ? " is-active" : ""}`} onClick={() => { setMode("charger"); setReferenceSearch(""); }}>
                <ChargerIcon size={15} /> Charger
              </button>
            </div>

            <label className="rg-decision-select" htmlFor="new-diagnostic-reference">{mode === "phone" ? "Phone" : "Charger"} brand and model</label>
            <input id="new-diagnostic-reference" className="rg-diagnostic-reference-input" list="device-reference-options" value={referenceSearch} onChange={(event) => setReferenceSearch(event.target.value)} placeholder={`Search saved ${mode} references`} autoComplete="off" />
            <datalist id="device-reference-options">{referencesForMode.map((item) => <option key={item.model_id} value={`${item.brand} ${item.model_name}`} />)}</datalist>

            <button type="button" className="rg-add-reference-btn" onClick={() => { setAddReferenceMessage(""); setAddReferenceOpen(true); }}>
              <PlusIcon size={14} /> Add new {mode} reference
            </button>

            {chosenReference ? <p className="rg-small rg-muted">Saved reference: {chosenReference.baseline_weight_g} g{chosenReference.baseline_thickness_mm === null ? "" : ` · ${chosenReference.baseline_thickness_mm} mm`}</p> : <p className="rg-small rg-muted">Choose an existing {mode} reference above, or add a new one.</p>}
            <p className="rg-small rg-muted">If you&rsquo;re signed in, continuing sends a wake command to the station over MQTT. Delivery is best-effort: if the station does not start scanning within a few seconds, press its physical START button.</p>
            <div className="rg-modal__actions"><button className="rg-btn rg-btn--primary" type="button" disabled={!chosenReference} onClick={() => void beginDiagnostic()}>Continue to station</button></div>
          </section>
        </div>
      )}

      {addReferenceOpen && (
        <div className="rg-modal-backdrop" role="presentation" onClick={() => setAddReferenceOpen(false)}>
          <section className="rg-modal" role="dialog" aria-modal="true" aria-labelledby="add-reference-heading" onClick={(event) => event.stopPropagation()}>
            <div className="rg-row rg-row--between">
              <div><h2 id="add-reference-heading">Add {mode} reference</h2><p className="rg-modal__sub">Saved instantly — it appears in the list above right away.</p></div>
              <button className="rg-btn" type="button" onClick={() => setAddReferenceOpen(false)}>Close</button>
            </div>
            <form className="rg-reference-form" onSubmit={(event) => void addDeviceReference(event)}>
              <label>Brand<input name="brand" required maxLength={80} placeholder={mode === "phone" ? "e.g. Samsung" : "e.g. Anker"} /></label>
              <label>Model<input name="model" required maxLength={120} placeholder={mode === "phone" ? "e.g. Galaxy S24" : "e.g. 20W USB-C"} /></label>
              <label>Reference weight (g)<input name="weight" type="number" min="1" step="0.1" required /></label>
              <label>Thickness (mm), optional<input name="thickness" type="number" min="0.1" step="0.1" /></label>
              <button className="rg-btn rg-btn--primary" type="submit" disabled={addReferenceSaving}>{addReferenceSaving ? "Saving…" : `Save ${mode} reference`}</button>
              {addReferenceMessage && <span className="rg-small" role="status">{addReferenceMessage} {addReferenceMessage.startsWith("Sign in") && <Link href="/login">Sign in</Link>}</span>}
            </form>
          </section>
        </div>
      )}

      {pendingScan && !activeReport && (
        <div className="rg-modal-backdrop rg-scan-backdrop" role="presentation">
          <section className="rg-modal rg-scan-modal" role="dialog" aria-modal="true" aria-labelledby="scanning-heading">
            <div className={`rg-scan-ring-wrap${scanIndeterminate ? " rg-scan-ring--indeterminate" : ""}`}>
              <svg className="rg-scan-ring" viewBox="0 0 120 120" aria-hidden="true">
                <circle className="rg-scan-ring__track" cx="60" cy="60" r={RING_RADIUS} />
                <circle className="rg-scan-ring__progress" cx="60" cy="60" r={RING_RADIUS} style={{ strokeDashoffset: ringOffset }} />
              </svg>
              <div className="rg-scan-ring__icon">
                {scanModeWord === "phone" ? <PhoneIcon size={30} /> : <ChargerIcon size={30} />}
              </div>
            </div>
            <h2 id="scanning-heading" className="rg-scan-title">{scanIndeterminate ? "Finishing up…" : "Scanning…"}</h2>
            <p className="rg-scan-caption" key={captionIndex}>{SCAN_CAPTIONS[captionIndex]}</p>
            <div className="rg-scan-timer">{scanIndeterminate ? "Almost done" : `${secondsLeft}s remaining`}</div>
            <p className="rg-scan-hint">Keep the {scanModeWord} still on the station. Press the physical STOP button to cancel.</p>
          </section>
        </div>
      )}

      {activeReport && activeReport.status === "stopped_by_operator" && (
        <div className="rg-modal-backdrop" role="presentation" onClick={() => setActiveReport(null)}>
          <section className="rg-modal" role="dialog" aria-modal="true" aria-labelledby="diagnostic-stopped-heading" onClick={(event) => event.stopPropagation()}>
            <div className="rg-row rg-row--between"><div><h2 id="diagnostic-stopped-heading">Scanning stopped</h2><p className="rg-modal__sub">Session {activeReport.session_id} · {new Date(activeReport.reported_at).toLocaleString()}</p></div><button className="rg-btn" type="button" onClick={() => setActiveReport(null)}>Close</button></div>
            <p className="rg-small">The operator pressed the station&rsquo;s physical STOP button. Sensor reading was cancelled before a result was produced.</p>
            <div className="rg-modal__actions"><button className="rg-btn rg-btn--primary" type="button" onClick={() => setActiveReport(null)}>Done</button></div>
          </section>
        </div>
      )}

      {activeReport && activeReport.status !== "stopped_by_operator" && (
        <div className="rg-modal-backdrop" role="presentation" onClick={() => setActiveReport(null)}>
          <section className="rg-modal rg-result-modal" role="dialog" aria-modal="true" aria-labelledby="diagnostic-result-heading" onClick={(event) => event.stopPropagation()}>
            <div className="rg-row rg-row--between"><div><h2 id="diagnostic-result-heading">Scan result</h2><p className="rg-modal__sub">Session {activeReport.session_id} · {new Date(activeReport.reported_at).toLocaleString()}</p></div><button className="rg-btn" type="button" onClick={() => setActiveReport(null)}>Close</button></div>
            {activeReport.fault && <div className="rg-alert-banner rg-result-warning" role="alert"><strong>Station reported a fault</strong><span>{activeReport.fault}</span></div>}
            {!selectedReference && <label className="rg-decision-select">Device reference<select value={referenceId} onChange={(event) => setReferenceId(event.target.value)}><option value="">Select a saved brand and model</option>{deviceReferences.map((item) => <option key={item.model_id} value={item.model_id}>{item.brand} {item.model_name} ({item.device_type})</option>)}</select></label>}
            <div className="rg-result-summary">
              <div><span>Station status</span><strong>{activeReport.status}</strong></div>
              <div><span>Stability</span><strong>{hasStableReadings(activeReport) ? "Confirmed" : "Not confirmed"}</strong></div>
              <div><span>Firmware grade</span><strong>{hasStableReadings(activeReport) ? activeReport.grade ?? "Not produced" : "Not available"}</strong></div>
              <div><span>Device reference</span><strong>{selectedReference ? `${selectedReference.brand} ${selectedReference.model_name}` : "Select a reference"}</strong></div>
            </div>
            <h3>Measured readings</h3>
            {hasStableReadings(activeReport) ? (
              <div className="rg-result-readings">{Object.entries(readingsFor(activeReport)).filter(([key]) => !["stable", "stability_samples", "stability_window_ms"].includes(key)).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{typeof value === "number" || typeof value === "string" ? value : "Not reported"}</strong></div>)}</div>
            ) : <p className="rg-small rg-muted">Stability was not confirmed. Raw sensor readings are hidden; correct sensor or calibration issues and retry.</p>}
            {selectedReference && <div className="rg-reference-compare"><strong>Device reference: {selectedReference.brand} {selectedReference.model_name}</strong><span>Baseline weight: {selectedReference.baseline_weight_g} g</span><span>Baseline thickness: {selectedReference.baseline_thickness_mm ?? "Not recorded"}</span></div>}
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
