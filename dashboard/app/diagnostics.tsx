"use client";

import "./globals.css";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./components/TopNav";
import { PhoneIcon, ChargerIcon, PlusIcon } from "./components/Icons";
import { createClient } from "@/lib/supabase/client";
import { ensureUser } from "@/lib/supabase/ensure-user";
import { getStationMode, type StationMode } from "@/lib/settings";
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
  device_reference?: string | null;
};

type DeviceType = "phone" | "charger";

type DeviceReference = {
  model_id: number;
  brand: string;
  model_name: string;
  device_type: DeviceType;
  baseline_weight_g: number;
  baseline_thickness_mm: number | null;
  source?: "catalog" | "operator-added";
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
// Long enough to cover a real round trip for the one real sensor involved:
// station_command insert -> cloud listener's ~1s poll -> MQTT relay -> five
// MLX90614 samples 300ms apart -> publish -> listener persists -> our own
// ~1s poll picks it up. If it still hasn't arrived by then, finalize with a
// fabricated temperature instead of hanging the demo on hardware.
const DEMO_SCAN_WINDOW_MS = 9_000;
const DEMO_TEMPERATURE_POLL_INTERVAL_MS = 1_000;
const DEMO_JITTER_INTERVAL_MS = 900;
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

function formatReading(key: string, value: Json | undefined) {
  if (typeof value !== "number") return typeof value === "string" ? value : "Not reported";
  const number = key.endsWith("_counts") ? String(Math.round(value)) : value.toFixed(2);
  const unit = key.endsWith("_counts") ? " counts"
    : key.endsWith("_g") ? " g"
    : key.endsWith("_mm") ? " mm"
    : key.endsWith("_ma") ? " mA"
    : key.endsWith("_c") ? " °C"
    : key.endsWith("_v") ? " V"
    : "";
  return `${number}${unit}`;
}

function randomBetween(minimum: number, maximum: number, decimals = 1) {
  const scale = 10 ** decimals;
  return Math.round((minimum + Math.random() * (maximum - minimum)) * scale) / scale;
}

function resolveStationId(isDemo?: boolean): string {
  const base = process.env.NEXT_PUBLIC_STATION_ID ?? "regrade-station-001";
  return isDemo ? `${base}-demo` : base;
}

// Keep this field set identical to what main.cpp actually publishes
// (weight_g, thickness_mm, current_ma, surface_temp_c, temperature_rise_c —
// see publishReport/publishLiveSensorReadings in firmware/src/main.cpp).
// No tof_distance_mm/voltage/ambient_c fields: the real flow never reports
// those, so a demo result shouldn't invent extra fields a genuine one
// wouldn't have.
function percentBand(center: number, percent: number): [number, number] {
  return [center * (1 - percent), center * (1 + percent)];
}

// Generated client-side (no physical station or MQTT involved): the first
// sample for the live panel, sampled across the full +/-5% band around the
// saved reference. Later ticks nudge off this instead of resampling the
// whole band, so the panel drifts like sensor noise rather than jumping
// around — and every field here, including thickness, updates live instead
// of only appearing once the scan locks in.
function initialDemoReadings(reference: DeviceReference, mode: DeviceType): Record<string, number> {
  const [weightMin, weightMax] = percentBand(reference.baseline_weight_g, 0.05);
  const [thicknessMin, thicknessMax] = percentBand(reference.baseline_thickness_mm ?? 8, 0.05);
  const [currentMin, currentMax] = percentBand(mode === "phone" ? 520 : 500, 0.05);
  return {
    weight_g: randomBetween(Math.max(1, weightMin), weightMax, 1),
    thickness_mm: randomBetween(Math.max(0.1, thicknessMin), thicknessMax, 2),
    current_ma: randomBetween(currentMin, currentMax, 0),
    surface_temp_c: randomBetween(24, 27, 1),
    temperature_rise_c: randomBetween(0.5, 3, 1),
  };
}

function stepTowards(previous: number, minimum: number, maximum: number, maxStep: number, decimals = 1) {
  const delta = (Math.random() * 2 - 1) * maxStep;
  const next = Math.min(maximum, Math.max(minimum, previous + delta));
  const scale = 10 ** decimals;
  return Math.round(next * scale) / scale;
}

// One small step off the previous live sample, clamped back into the same
// +/-5% band initialDemoReadings draws from — mimics how a real sensor's
// readout hovers and drifts rather than re-rolling a fresh number every tick.
function nudgeDemoReadings(previous: Record<string, number>, reference: DeviceReference, mode: DeviceType): Record<string, number> {
  const [weightMin, weightMax] = percentBand(reference.baseline_weight_g, 0.05);
  const [thicknessMin, thicknessMax] = percentBand(reference.baseline_thickness_mm ?? 8, 0.05);
  const [currentMin, currentMax] = percentBand(mode === "phone" ? 520 : 500, 0.05);
  return {
    weight_g: stepTowards(previous.weight_g, Math.max(1, weightMin), weightMax, 0.4, 1),
    thickness_mm: stepTowards(previous.thickness_mm, Math.max(0.1, thicknessMin), thicknessMax, 0.08, 2),
    current_ma: stepTowards(previous.current_ma, currentMin, currentMax, mode === "phone" ? 4 : 10, 0),
    surface_temp_c: stepTowards(previous.surface_temp_c, 24, 27, 0.15, 1),
    temperature_rise_c: Math.max(0, stepTowards(previous.temperature_rise_c, 0.5, 3, 0.1, 1)),
  };
}

// +/-5% around a center value, so the locked-in reading looks like a real
// measurement with ordinary part-to-part variance instead of a round number.
function withSpread(center: number, percent: number, decimals = 2) {
  const delta = center * percent * (Math.random() * 2 - 1);
  const scale = 10 ** decimals;
  return Math.round((center + delta) * scale) / scale;
}

// The result the demo settles on once its scan window ends.
function finalDemoReadings(reference: DeviceReference, mode: DeviceType): Record<string, number> {
  const baselineWeight = reference.baseline_weight_g;
  const baselineThickness = reference.baseline_thickness_mm ?? 8;
  const nominalCurrentMa = mode === "phone" ? 520 : 500;
  return {
    weight_g: Math.max(1, withSpread(baselineWeight, 0.05, 1)),
    thickness_mm: Math.max(0.1, withSpread(baselineThickness, 0.05, 2)),
    current_ma: Math.max(0, withSpread(nominalCurrentMa, 0.05, 0)),
    surface_temp_c: randomBetween(25, 26.5, 1),
    temperature_rise_c: randomBetween(0.5, 2.5, 1),
  };
}

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  if (error !== null && typeof error === "object" && "message" in error && typeof error.message === "string") {
    const details = "details" in error && typeof error.details === "string" ? error.details : "";
    const hint = "hint" in error && typeof error.hint === "string" ? error.hint : "";
    const code = "code" in error && typeof error.code === "string" ? ` (${error.code})` : "";
    return [error.message + code, details, hint].filter(Boolean).join(" ");
  }
  return fallback;
}

export function DiagnosticsPage({ telemetry, telemetryError, referenceError, savedReviewError, references, savedTelemetryIds }: DiagnosticsPageProps) {
  const router = useRouter();
  const [stationReports, setStationReports] = useState(telemetry);
  const [reportReferences, setReportReferences] = useState<Record<number, string>>({});
  const [reportActionMessage, setReportActionMessage] = useState("");
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);
  const [deviceReferences, setDeviceReferences] = useState(references);
  const [activeReport, setActiveReport] = useState<Telemetry | null>(null);
  const [showSensorReadings, setShowSensorReadings] = useState(true);
  const [liveReport, setLiveReport] = useState<Telemetry | null>(null);
  const [showLiveSensorFeed, setShowLiveSensorFeed] = useState(true);
  const [liveReadingReceivedAt, setLiveReadingReceivedAt] = useState<number | null>(null);
  const [savedReports, setSavedReports] = useState(savedTelemetryIds);
  const [referenceId, setReferenceId] = useState("");
  const [referenceSearch, setReferenceSearch] = useState("");
  const [mode, setMode] = useState<DeviceType>("phone");
  const [stationMode, setStationMode] = useState<StationMode>("live");
  const demoTimersRef = useRef<{ interval: number; timeout: number; temperaturePoll?: number } | null>(null);
  const [newDiagnosticOpen, setNewDiagnosticOpen] = useState(false);
  const [addReferenceOpen, setAddReferenceOpen] = useState(false);
  const [addReferenceSaving, setAddReferenceSaving] = useState(false);
  const [addReferenceMessage, setAddReferenceMessage] = useState("");
  const [referenceActionMessage, setReferenceActionMessage] = useState("");
  const [deletingReferenceId, setDeletingReferenceId] = useState<number | null>(null);
  const [pendingScan, setPendingScan] = useState<{ startedAt: string; referenceId: string; mode: DeviceType; isDemo?: boolean; sessionId?: string } | null>(null);
  const [scanMessage, setScanMessage] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());
  const [operatorDecision, setOperatorDecision] = useState<"resellable" | "recycle" | "disposal" | "needs-review">("needs-review");
  const [saveMessage, setSaveMessage] = useState("");
  const selectedReference = deviceReferences.find((item) => String(item.model_id) === referenceId);
  const referencesForMode = deviceReferences.filter((item) => item.device_type === mode);
  const matchingReferences = referenceSearch.trim()
    ? referencesForMode.filter((item) => `${item.brand} ${item.model_name}`.toLowerCase().includes(referenceSearch.trim().toLowerCase()))
    : referencesForMode.slice(0, 8);
  const chosenReference = referencesForMode.find(
    (item) => `${item.brand} ${item.model_name}`.toLowerCase() === referenceSearch.trim().toLowerCase(),
  );

  useEffect(() => {
    setStationReports(telemetry);
  }, [telemetry]);

  useEffect(() => {
    if (!pendingScan) return;
    const supabase = createClient();
    const stationId = resolveStationId(pendingScan.isDemo);
    const interval = window.setInterval(async () => {
      if (Date.now() - new Date(pendingScan.startedAt).getTime() > SCAN_TIMEOUT_MS) {
        setPendingScan(null);
        setLiveReport(null);
        setScanMessage(pendingScan.isDemo
          ? "The scan did not finish in time. Try again."
          : "No report arrived within one minute. Check the ESP32, MQTT listener, broker, and Supabase connection, then try again.");
        return;
      }
      // The demo path updates one row in place rather than inserting a new
      // row per tick, so reported_at never advances past the first insert;
      // match it by session_id instead of a reported_at comparison.
      const baseQuery = supabase
        .from("station_telemetry")
        .select("telemetry_id, station_id, session_id, status, duration_ms, readings, grade, health_score, fault, reported_at")
        .eq("station_id", stationId);
      const scopedQuery = pendingScan.isDemo && pendingScan.sessionId
        ? baseQuery.eq("session_id", pendingScan.sessionId)
        : baseQuery.gt("reported_at", pendingScan.startedAt);
      const { data, error } = await scopedQuery
        .order("reported_at", { ascending: false })
        .limit(1);
      if (error) {
        setScanMessage(`Could not check for a station report: ${error.message}`);
        return;
      }
      const report = data?.[0];
      if (!report) return;
      if (report.status === "scanning") {
        setLiveReport(report);
        setLiveReadingReceivedAt(Date.now());
        setScanMessage("Live sensor readings are updating from the station.");
        return;
      }
      setLiveReport(null);
      const reference = deviceReferences.find((item) => String(item.model_id) === pendingScan.referenceId);
      if (reference) {
        setReportReferences((current) => ({ ...current, [report.telemetry_id]: `${reference.brand} ${reference.model_name}` }));
      }
      setReferenceId(pendingScan.referenceId);
      setActiveReport(report);
      setShowSensorReadings(true);
      setPendingScan(null);
      setScanMessage(report.status === "stopped_by_operator"
        ? "Scanning was stopped at the station."
        : hasStableReadings(report)
        ? "Stable station readings received."
        : "A report arrived, but stability was not confirmed. Live readings are shown as unvalidated.");
      router.refresh();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [pendingScan, router, deviceReferences]);

  useEffect(() => {
    if (!pendingScan) return;
    const ticker = window.setInterval(() => setNowTick(Date.now()), 250);
    return () => window.clearInterval(ticker);
  }, [pendingScan]);

  useEffect(() => {
    setStationMode(getStationMode());
  }, []);

  useEffect(() => {
    return () => {
      if (demoTimersRef.current) {
        window.clearInterval(demoTimersRef.current.interval);
        window.clearTimeout(demoTimersRef.current.timeout);
        if (demoTimersRef.current.temperaturePoll) window.clearInterval(demoTimersRef.current.temperaturePoll);
      }
    };
  }, []);

  async function beginDiagnostic() {
    if (!chosenReference) return;
    const chosenReferenceId = String(chosenReference.model_id);
    const deviceWord = mode === "phone" ? "phone" : "charger";
    setLiveReport(null);
    setLiveReadingReceivedAt(null);
    setShowLiveSensorFeed(true);
    setReferenceId(chosenReferenceId);
    setPendingScan({ startedAt: new Date().toISOString(), referenceId: chosenReferenceId, mode });
    setNewDiagnosticOpen(false);
    setScanMessage(`Place one closed ${deviceWord} on the station. Sending a wake command...`);

    try {
      const supabase = createClient();
      const user = await ensureUser(supabase);
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

  async function beginExhibitDemoScan() {
    if (!chosenReference) return;
    const reference = chosenReference;
    const referenceIdValue = String(reference.model_id);
    const deviceWord = mode === "phone" ? "phone" : "charger";
    const stationId = resolveStationId(true);
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const scanStartedAtIso = new Date().toISOString();

    setLiveReport(null);
    setLiveReadingReceivedAt(null);
    setShowLiveSensorFeed(true);
    setReferenceId(referenceIdValue);
    setNewDiagnosticOpen(false);
    setScanMessage(`Place one closed ${deviceWord} on the station.`);

    const supabase = createClient();
    let liveReadings = initialDemoReadings(reference, mode);
    let operatorId: string;
    try {
      const user = await ensureUser(supabase);
      operatorId = user.id;
      const { error } = await supabase.from("station_telemetry").insert({
        station_id: stationId,
        session_id: sessionId,
        status: "scanning",
        readings: liveReadings,
      });
      if (error) throw error;
    } catch (error) {
      setScanMessage(errorMessage(error, "Could not start the diagnostic."));
      return;
    }

    setPendingScan({ startedAt: scanStartedAtIso, referenceId: referenceIdValue, mode, isDemo: true, sessionId });

    // Ask the station for a real ambient/surface reading (the MLX90614 is
    // the one sensor that's actually wired and working). This never blocks
    // the demo: if it doesn't arrive in time, finishTimer below falls back
    // to a fabricated temperature same as every other reading.
    void supabase.from("station_command").insert({
      station_id: stationId,
      command: "start",
      requested_by: operatorId,
    });

    let realTemperature: { surface_temp_c: number; temperature_rise_c: number } | null = null;
    const temperaturePoll = window.setInterval(() => {
      void supabase
        .from("station_telemetry")
        .select("session_id, readings, reported_at")
        .eq("station_id", stationId)
        .neq("session_id", sessionId)
        .gt("reported_at", scanStartedAtIso)
        .order("reported_at", { ascending: false })
        .limit(1)
        .then(({ data }) => {
          const row = data?.[0];
          const rowReadings = row?.readings;
          const readingsRecord = rowReadings !== null && typeof rowReadings === "object" && !Array.isArray(rowReadings)
            ? rowReadings as Record<string, Json | undefined>
            : null;
          const surfaceTempC = readingsRecord?.surface_temp_c;
          const temperatureRiseC = readingsRecord?.temperature_rise_c;
          if (typeof surfaceTempC === "number" && typeof temperatureRiseC === "number") {
            realTemperature = { surface_temp_c: surfaceTempC, temperature_rise_c: temperatureRiseC };
            window.clearInterval(temperaturePoll);
          }
        });
    }, DEMO_TEMPERATURE_POLL_INTERVAL_MS);

    const jitterTimer = window.setInterval(() => {
      liveReadings = nudgeDemoReadings(liveReadings, reference, mode);
      void supabase
        .from("station_telemetry")
        .update({ readings: realTemperature ? { ...liveReadings, ...realTemperature } : liveReadings })
        .eq("station_id", stationId)
        .eq("session_id", sessionId);
    }, DEMO_JITTER_INTERVAL_MS);

    const finishTimer = window.setTimeout(() => {
      window.clearInterval(jitterTimer);
      window.clearInterval(temperaturePoll);
      const finalReadings = finalDemoReadings(reference, mode);
      if (realTemperature) Object.assign(finalReadings, realTemperature);
      void supabase
        .from("station_telemetry")
        .update({
          status: "readings_stable",
          readings: { ...finalReadings, stable: true },
          grade: "A",
          health_score: 100,
        })
        .eq("station_id", stationId)
        .eq("session_id", sessionId);
      demoTimersRef.current = null;
    }, DEMO_SCAN_WINDOW_MS);

    demoTimersRef.current = { interval: jitterTimer, timeout: finishTimer, temperaturePoll };
  }

  function cancelPendingDemoScan() {
    if (demoTimersRef.current) {
      window.clearInterval(demoTimersRef.current.interval);
      window.clearTimeout(demoTimersRef.current.timeout);
      if (demoTimersRef.current.temperaturePoll) window.clearInterval(demoTimersRef.current.temperaturePoll);
      demoTimersRef.current = null;
    }
    if (pendingScan?.isDemo && pendingScan.sessionId) {
      const supabase = createClient();
      void supabase.from("station_telemetry").delete()
        .eq("station_id", resolveStationId(true))
        .eq("session_id", pendingScan.sessionId);
    }
    setPendingScan(null);
    setLiveReport(null);
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
      const user = await ensureUser(supabase);
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
      if (error !== null && typeof error === "object" && "code" in error && error.code === "23505") {
        const supabase = createClient();
        const { data: existing, error: lookupError } = await supabase
          .from("device_model")
          .select("model_id, brand, model_name, device_type, baseline_weight_g, baseline_thickness_mm")
          .eq("brand", brand)
          .eq("model_name", model)
          .eq("device_type", mode)
          .maybeSingle();
        if (existing && !lookupError) {
          setDeviceReferences((current) => current.some((item) => item.model_id === existing.model_id)
            ? current
            : [...current, existing]);
          setReferenceSearch(`${existing.brand} ${existing.model_name}`);
          setAddReferenceOpen(false);
          return;
        }
        setAddReferenceMessage(lookupError
          ? `This reference already exists, but could not be loaded: ${errorMessage(lookupError, "database lookup failed")}`
          : "This reference already exists. Refresh the page and search for it in the phone list.");
        return;
      }
      setAddReferenceMessage(errorMessage(error, "Could not save this reference."));
    } finally {
      setAddReferenceSaving(false);
    }
  }

  async function deleteDeviceReference(reference: DeviceReference) {
    if (reference.source !== "operator-added" || !window.confirm(`Delete ${reference.brand} ${reference.model_name}?`)) return;
    setDeletingReferenceId(reference.model_id);
    setReferenceActionMessage("");
    try {
      const supabase = createClient();
      const user = await ensureUser(supabase);
      const { data, error } = await supabase.from("device_model").delete()
        .eq("model_id", reference.model_id).eq("created_by", user.id)
        .select("model_id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Only the operator who added this reference can delete it.");
      setDeviceReferences((current) => current.filter((item) => item.model_id !== reference.model_id));
      setReferenceSearch("");
      setReferenceId("");
    } catch (error) {
      setReferenceActionMessage(errorMessage(error, "Could not delete this reference."));
    } finally {
      setDeletingReferenceId(null);
    }
  }

  async function deleteStationReport(report: Telemetry) {
    if (!window.confirm("Delete this recent reading? Any saved diagnosis linked to it will also be deleted.")) return;
    setDeletingReportId(report.telemetry_id);
    setReportActionMessage("");
    try {
      const supabase = createClient();
      await ensureUser(supabase);
      const { data, error } = await supabase.from("station_telemetry").delete()
        .eq("telemetry_id", report.telemetry_id).select("telemetry_id").maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("The reading was not deleted. Check your session and database permissions.");
      setStationReports((current) => current.filter((item) => item.telemetry_id !== report.telemetry_id));
      setReportActionMessage("Recent reading deleted.");
      if (activeReport?.telemetry_id === report.telemetry_id) setActiveReport(null);
      router.refresh();
    } catch (error) {
      setReportActionMessage(errorMessage(error, "Could not delete this reading."));
    } finally {
      setDeletingReportId(null);
    }
  }

  async function saveDiagnosis(report: Telemetry) {
    setSaveMessage("");
    try {
      const supabase = createClient();
      const user = await ensureUser(supabase);
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

  const activeScanWindowMs = pendingScan?.isDemo ? DEMO_SCAN_WINDOW_MS : SCAN_WINDOW_MS;
  const elapsedMs = pendingScan ? Math.max(0, nowTick - new Date(pendingScan.startedAt).getTime()) : 0;
  const scanIndeterminate = elapsedMs >= activeScanWindowMs;
  const secondsLeft = Math.max(0, Math.ceil((activeScanWindowMs - elapsedMs) / 1000));
  const ringOffset = scanIndeterminate ? 0 : RING_CIRCUMFERENCE * (elapsedMs / activeScanWindowMs);
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
              <button className="rg-btn rg-btn--primary" disabled={Boolean(pendingScan)} onClick={() => { setReferenceSearch(""); setStationMode(getStationMode()); setNewDiagnosticOpen(true); }}>New diagnostic</button>
            </div>
          </div>

          {scanMessage && <p className="rg-small" role="status">{scanMessage}</p>}
          {referenceError && <p className="rg-small" role="alert">Could not load device references. Check the Supabase project and apply pending migrations.</p>}
          {savedReviewError && <p className="rg-small" role="alert">Could not load saved review status. Check the operator-diagnosis migration and your sign-in session.</p>}

          <section className="rg-card rg-card--pad">
            <h2>Latest station readings</h2>
            <p className="rg-small rg-muted">Reports are read from Supabase. Refresh to load reports received outside this workflow.</p>
            {reportActionMessage && <p className="rg-small" role="status">{reportActionMessage}</p>}
            {telemetryError ? <p className="rg-small">Could not load reports. Confirm the telemetry migration and dashboard Supabase project.</p> : stationReports.length === 0 ? <p className="rg-small">No station reports have arrived yet.</p> : (
              <div className="rg-table-wrap">
                <table className="rg-rules-table">
                  <thead><tr><th>Received</th><th>Station</th><th>Device reference</th><th>Status</th><th>Stable</th><th>Grade</th><th>Weight (g)</th><th>Thickness (mm)</th><th>Current (mA)</th><th>Temp rise (°C)</th><th></th></tr></thead>
                  <tbody>{stationReports.map((record) => <tr key={record.telemetry_id}>
                    <td>{new Date(record.reported_at).toLocaleString()}</td><td>{record.station_id}</td><td>{reportReferences[record.telemetry_id] ?? record.device_reference ?? "Reference not recorded"}</td><td>{record.status}</td>
                    <td>{hasStableReadings(record) ? "Yes" : "No"}</td><td>{hasStableReadings(record) ? record.grade ?? "—" : "—"}</td>
                    <td>{stableValue(record, "weight_g")}</td><td>{stableValue(record, "thickness_mm")}</td><td>{stableValue(record, "current_ma")}</td><td>{stableValue(record, "temperature_rise_c")}</td>
                    <td><div className="rg-row rg-row--compact"><button type="button" className="rg-btn" onClick={() => { setReferenceId(""); setShowSensorReadings(true); setActiveReport(record); }}>Review result</button><button type="button" className="rg-btn rg-btn--danger" disabled={deletingReportId === record.telemetry_id} onClick={() => void deleteStationReport(record)}>{deletingReportId === record.telemetry_id ? "Deleting…" : "Delete"}</button></div></td>
                  </tr>)}</tbody>
                </table>
              </div>
            )}
          </section>

          <section className="rg-card rg-card--pad">
            <h3>How to run a scan</h3>
            <ol>
              <li>Pick <strong>Phone</strong> or <strong>Charger</strong> mode and select (or add) a reference with <strong>New diagnostic</strong>.</li>
              <li>Place one closed device on the assembled station. Continuing sends a wake command to the station; if it doesn&rsquo;t arrive, press its physical <strong>START</strong> button.</li>
              <li>Live sensor readings stream during the scan. Only readings that pass the stability check are eligible for grading.</li>
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
            <input id="new-diagnostic-reference" className="rg-diagnostic-reference-input" value={referenceSearch} onChange={(event) => { setReferenceSearch(event.target.value); setReferenceId(""); }} placeholder={`Search saved ${mode} references`} autoComplete="off" />
            {matchingReferences.length > 0 && <div className="rg-reference-search-results" aria-label="Matching saved references">
              {matchingReferences.slice(0, 12).map((item) => <div className="rg-reference-search-result" key={item.model_id}>
                <button type="button" aria-pressed={String(item.model_id) === referenceId} onClick={() => { setReferenceSearch(`${item.brand} ${item.model_name}`); setReferenceId(String(item.model_id)); }}>
                  <strong>{item.brand} {item.model_name}</strong><span>{item.baseline_weight_g} g{item.baseline_thickness_mm === null ? "" : ` · ${item.baseline_thickness_mm} mm`}</span>
                </button>
                {item.source === "operator-added" && <button type="button" className="rg-reference-delete-btn" disabled={deletingReferenceId === item.model_id} onClick={() => void deleteDeviceReference(item)}>{deletingReferenceId === item.model_id ? "Deleting…" : "Delete"}</button>}
              </div>)}
            </div>}
            {referenceSearch.trim() && matchingReferences.length === 0 && <p className="rg-small rg-muted">No saved {mode} references match that search.</p>}
            {referenceActionMessage && <p className="rg-small" role="alert">{referenceActionMessage}</p>}

            <button type="button" className="rg-add-reference-btn" onClick={() => { setAddReferenceMessage(""); setAddReferenceOpen(true); }}>
              <PlusIcon size={14} /> Add new {mode} reference
            </button>

            {chosenReference ? <p className="rg-small rg-muted">Saved reference: {chosenReference.baseline_weight_g} g{chosenReference.baseline_thickness_mm === null ? "" : ` · ${chosenReference.baseline_thickness_mm} mm`}</p> : <p className="rg-small rg-muted">Choose an existing {mode} reference above, or add a new one.</p>}
            <p className="rg-small rg-muted">Continuing starts the diagnostic scan.</p>
            <div className="rg-modal__actions">
              <button className="rg-btn rg-btn--primary" type="button" disabled={!chosenReference} onClick={() => void (stationMode === "demo" ? beginExhibitDemoScan() : beginDiagnostic())}>Start diagnostic</button>
            </div>
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
              {addReferenceMessage && <span className="rg-small" role="status">{addReferenceMessage}</span>}
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
            {pendingScan.isDemo ? (
              <button className="rg-btn" type="button" onClick={cancelPendingDemoScan}>Stop scan</button>
            ) : (
              <p className="rg-scan-hint">Keep the {scanModeWord} still on the station. Press the physical STOP button to cancel.</p>
            )}
            <section className="rg-live-sensor-feed" aria-labelledby="live-sensor-feed-heading">
              <div className="rg-row rg-row--between"><h3 id="live-sensor-feed-heading">Live sensor readings</h3><button className="rg-btn" type="button" aria-expanded={showLiveSensorFeed} aria-controls="live-sensor-feed-values" onClick={() => setShowLiveSensorFeed((visible) => !visible)}>{showLiveSensorFeed ? "Hide" : "Show"}</button></div>
              {showLiveSensorFeed ? liveReport ? (
                <>
                  <p className="rg-small rg-muted">Live and unvalidated · {liveReadingReceivedAt === null ? "Waiting for update" : `updated ${Math.max(0, Math.floor((nowTick - liveReadingReceivedAt) / 1000))}s ago`}</p>
                  <div className="rg-result-readings" id="live-sensor-feed-values">{Object.entries(readingsFor(liveReport)).filter(([key]) => !["stable", "stability_samples", "stability_window_ms"].includes(key)).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{formatReading(key, value)}</strong></div>)}</div>
                </>
              ) : <p className="rg-small rg-muted" id="live-sensor-feed-values">Waiting for live readings from the station.</p> : <p className="rg-small rg-muted" id="live-sensor-feed-values">Live sensor readings are hidden.</p>}
            </section>
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
            {hasStableReadings(activeReport) && activeReport.grade === "A" && (
              <div className="rg-celebration" role="status">
                <div className="rg-celebration__confetti" aria-hidden="true">
                  {Array.from({ length: 14 }).map((_, index) => <span key={index} className="rg-celebration__piece" style={{ left: `${(index * 7.3) % 100}%`, animationDelay: `${(index % 7) * 0.12}s` }} />)}
                </div>
                <p className="rg-celebration__message">{(selectedReference?.device_type ?? mode) === "charger" ? "YOUR CHARGER IS HEALTHY!" : "YOUR PHONE IS HEALTHY!"}</p>
              </div>
            )}
            {activeReport.fault && <div className="rg-alert-banner rg-result-warning" role="alert"><strong>Station reported a fault</strong><span>{activeReport.fault}</span></div>}
            {!selectedReference && <label className="rg-decision-select">Device reference<select value={referenceId} onChange={(event) => setReferenceId(event.target.value)}><option value="">Select a saved brand and model</option>{deviceReferences.map((item) => <option key={item.model_id} value={item.model_id}>{item.brand} {item.model_name} ({item.device_type})</option>)}</select></label>}
            <div className="rg-result-summary">
              <div><span>Station status</span><strong>{activeReport.status}</strong></div>
              <div><span>Stability</span><strong>{hasStableReadings(activeReport) ? "Confirmed" : "Not confirmed"}</strong></div>
              <div><span>Firmware grade</span><strong>{hasStableReadings(activeReport) ? activeReport.grade ?? "Not produced" : "Not available"}</strong></div>
              <div><span>Device reference</span><strong>{selectedReference ? `${selectedReference.brand} ${selectedReference.model_name}` : "Select a reference"}</strong></div>
            </div>
            <h3>Measured readings</h3>
            <button className="rg-btn" type="button" aria-expanded={showSensorReadings} aria-controls="scan-sensor-readings" onClick={() => setShowSensorReadings((visible) => !visible)}>{showSensorReadings ? "Hide sensor readings" : "Show sensor readings"}</button>
            {showSensorReadings ? (
              <>
                {!hasStableReadings(activeReport) && <p className="rg-small rg-muted">Unstable diagnostic values. These readings are not validated and are not used to produce a grade.</p>}
                <div className="rg-result-readings" id="scan-sensor-readings">{Object.entries(readingsFor(activeReport)).filter(([key]) => !["stable", "stability_samples", "stability_window_ms"].includes(key)).map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><strong>{formatReading(key, value)}</strong></div>)}</div>
              </>
            ) : <p className="rg-small rg-muted" id="scan-sensor-readings">Sensor readings are hidden.</p>}
            {selectedReference && <div className="rg-reference-compare"><strong>Device reference: {selectedReference.brand} {selectedReference.model_name}</strong><span>Baseline weight: {selectedReference.baseline_weight_g} g</span><span>Baseline thickness: {selectedReference.baseline_thickness_mm ?? "Not recorded"}</span></div>}
            <label className="rg-decision-select">Operator disposition<select value={operatorDecision} onChange={(event) => setOperatorDecision(event.target.value as typeof operatorDecision)}><option value="needs-review">Needs more review</option><option value="resellable">Suitable for reuse review</option><option value="recycle">Recycle review</option><option value="disposal">Disposal review</option></select></label>
            <p className="rg-small rg-muted">Saved dispositions are operator reviews, not automated safety or recycling classifications.</p>
            {saveMessage && <p className="rg-small" role="status">{saveMessage}</p>}
            <div className="rg-modal__actions"><button className="rg-btn rg-btn--primary" type="button" disabled={!hasStableReadings(activeReport) || !selectedReference || savedReports.includes(activeReport.telemetry_id)} onClick={() => void saveDiagnosis(activeReport)}>{savedReports.includes(activeReport.telemetry_id) ? "Diagnosis saved" : "Save diagnosis"}</button></div>
          </section>
        </div>
      )}
    </div>
  );
}

export default DiagnosticsPage;
