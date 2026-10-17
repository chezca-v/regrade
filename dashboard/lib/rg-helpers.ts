// ---------------------------------------------------------------------------
// ReGrade – pure helpers (no React, no side-effects)
// ---------------------------------------------------------------------------
import type { Device, DiagnosticResult, ProcessingDecision, ReadingTone } from "./rg-types";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------
export function fmtDate(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// ---------------------------------------------------------------------------
// Result / decision labels
// ---------------------------------------------------------------------------
export const RESULT_LABEL: Record<DiagnosticResult, string> = {
  resellable: "Resellable / Refurbishable",
  recycle: "Recycle / Safe Dismantling",
  disposal: "Disposal",
};

export const RESULT_COLOR: Record<DiagnosticResult, string> = {
  resellable: "green",
  recycle: "blue",
  disposal: "red",
};

export const DECISION_LABEL: Record<Exclude<ProcessingDecision, "awaiting">, string> = {
  "bin-a": "Verified, Bin A",
  "bin-b": "Verified, Bin B",
  "bin-c": "Verified, Bin C",
};

export const DECISION_BIN: Record<DiagnosticResult, Exclude<ProcessingDecision, "awaiting">> = {
  resellable: "bin-a",
  recycle: "bin-b",
  disposal: "bin-c",
};

// ---------------------------------------------------------------------------
// Reading status helper
// ---------------------------------------------------------------------------
export function getReadingStatus(tone: ReadingTone): "ok" | "warn" | "over" | "measuring" {
  return tone;
}

// ---------------------------------------------------------------------------
// KPI helpers – all derived from the device list, never hard-coded
// ---------------------------------------------------------------------------
export function countTestedToday(devices: Device[]): number {
  return devices.length;
}

export function countAwaiting(devices: Device[]): number {
  return devices.filter((d) => d.processingDecision === "awaiting").length;
}

export function countResellable(devices: Device[]): number {
  return devices.filter((d) => d.diagnosticResult === "resellable").length;
}

export function countSafetyAlerts(devices: Device[]): number {
  return devices.filter((d) => d.hasWarning).length;
}

export function countRouted(devices: Device[]): number {
  return devices.filter((d) => d.processingDecision !== "awaiting").length;
}

export function resellablePct(devices: Device[]): number {
  if (devices.length === 0) return 0;
  return Math.round((countResellable(devices) / devices.length) * 100);
}

export function countByResult(devices: Device[], result: DiagnosticResult): number {
  return devices.filter((d) => d.diagnosticResult === result).length;
}

export function pctByResult(devices: Device[], result: DiagnosticResult): number {
  if (devices.length === 0) return 0;
  return Math.round((countByResult(devices, result) / devices.length) * 100);
}

// ---------------------------------------------------------------------------
// Tab filter
// ---------------------------------------------------------------------------
export type AuditTab = "all" | "resellable" | "recycle" | "disposal" | "awaiting";

export function filterDevices(
  devices: Device[],
  tab: AuditTab,
  query: string,
  sortNewest: boolean
): Device[] {
  let result = devices;

  // tab filter
  if (tab !== "all") {
    result = result.filter((d) =>
      tab === "awaiting"
        ? d.processingDecision === "awaiting"
        : d.diagnosticResult === tab
    );
  }

  // search
  const q = query.trim().toLowerCase();
  if (q) {
    result = result.filter((d) => d.id.toLowerCase().includes(q));
  }

  // sort
  if (!sortNewest) {
    result = [...result].reverse();
  }

  return result;
}

// ---------------------------------------------------------------------------
// Decision suggestion after verification
// ---------------------------------------------------------------------------
export function suggestedDecision(result: DiagnosticResult): Exclude<ProcessingDecision, "awaiting"> {
  return DECISION_BIN[result];
}
