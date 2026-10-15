// ---------------------------------------------------------------------------
// ReGrade – shared domain types
// ---------------------------------------------------------------------------

export type DiagnosticResult =
  | "resellable"
  | "recycle"
  | "disposal";

export type ProcessingDecision =
  | "awaiting"
  | "bin-a"
  | "bin-b"
  | "bin-c";

export type ReadingTone = "ok" | "warn" | "over" | "measuring";

export type StageState = "done" | "active" | "waiting";

export type AlertStatus = "open" | "acknowledged" | "resolved";

// ---------------------------------------------------------------------------

export interface Reading {
  label: string;
  value: number | null;   // null = measuring
  unit: string;
  pct: number;            // 0-100 for the progress bar
  limit: string;          // display string, e.g. "Limit 250 mΩ"
  status: string;         // display string, e.g. "Within limit"
  tone: ReadingTone;
}

export interface Stage {
  label: string;
  sub: string;
  state: StageState;
}

export interface GradingRule {
  resultKey: DiagnosticResult;
  label: string;
  weight: string;
  swell: string;
  tempRise: string;
  chargeDraw: string;
  bin: string;
}

export interface Device {
  id: string;
  time: string;              // "14:32"
  esr: string;               // formatted, "142 mΩ" or "—"
  powerDraw: string;
  tempRise: string;
  swell: string;
  diagnosticResult: DiagnosticResult;
  processingDecision: ProcessingDecision;
  hasWarning?: boolean;
  brand: string;
  model: string;
  // raw readings kept for detail panel
  readings: Reading[];
  nominalWeight: number;     // g
  currentWeight: number;     // g
}

export interface SafetyAlert {
  id: string;
  deviceId: string;
  type: string;              // "Battery swelling"
  raisedAt: string;          // "REG-20261013-004, raised 13:57"
  description: string;
  status: AlertStatus;
}

export interface HazardStep {
  id: string;
  label: string;
  done: boolean;
}

export interface QueueDevice {
  id: string;
  model: string;
}
