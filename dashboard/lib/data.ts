export type DeviceType = "Smartphone" | "5V Charger";
export type Grade = "A" | "B" | "C" | "D";
export type SessionStatus = "Complete" | "Review" | "Hazard" | "Incomplete";

export interface DiagnosticRecord {
  id: string;
  model: string;
  brand: string;
  type: DeviceType;
  grade: Grade | null;
  status: SessionStatus;
  health: number | null;
  received: string;
  startedAt: string;
  station: string;
  stationId: string;
}

export interface StationRecord {
  id: string;
  name: string;
  firmwareVersion: string;
  lastSeenAt: string | null;
}

export interface ActiveRule {
  ruleVersionId: number;
  weightMinPct: number;
  thicknessSwellMm: number;
  thicknessMissingMm: number;
  overcurrentMa: number;
  zeroCurrentMa: number;
  tempRiseC: number;
  createdAt: string;
}
