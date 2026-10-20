// ---------------------------------------------------------------------------
// ReGrade – mock data
// All numbers are derived; never hard-coded in JSX.
// ---------------------------------------------------------------------------
import type {
  Device,
  SafetyAlert,
  HazardStep,
  QueueDevice,
  GradingRule,
  Stage,
  Reading,
} from "./rg-types";

// ---------------------------------------------------------------------------
// Devices (audit log)
// ---------------------------------------------------------------------------
export const DEVICES: Device[] = [
  {
    id: "REG-20261013-007",
    time: "14:32",
    esr: "142 mΩ",
    powerDraw: "640 mA",
    tempRise: "11.8 °C",
    swell: "0.6 mm",
    diagnosticResult: "resellable",
    processingDecision: "awaiting",
    brand: "Unknown",
    model: "Model X12",
    nominalWeight: 168,
    currentWeight: 168,
    readings: [
      { label: "Battery ESR", value: 142, unit: "mΩ", pct: 57, limit: "Limit 250 mΩ", status: "Within limit", tone: "ok" },
      { label: "Power draw", value: 640, unit: "mA", pct: 80, limit: "Range 500 to 800 mA", status: "In range", tone: "ok" },
      { label: "Temperature rise", value: 11.8, unit: "°C", pct: 79, limit: "Limit 15 °C", status: "Near limit", tone: "warn" },
      { label: "Casing swell", value: 0.6, unit: "mm", pct: 30, limit: "Limit 2.0 mm", status: "Within limit", tone: "ok" },
    ],
  },
  {
    id: "REG-20261013-006",
    time: "14:21",
    esr: "390 mΩ",
    powerDraw: "1,240 mA",
    tempRise: "18.4 °C",
    swell: "3.9 mm",
    diagnosticResult: "disposal",
    processingDecision: "bin-c",
    brand: "Unknown",
    model: "Unknown",
    nominalWeight: 168,
    currentWeight: 168,
    readings: [
      { label: "Battery ESR", value: 390, unit: "mΩ", pct: 100, limit: "Limit 250 mΩ", status: "Over limit", tone: "over" },
      { label: "Power draw", value: 1240, unit: "mA", pct: 100, limit: "Range 500 to 800 mA", status: "Overcurrent", tone: "over" },
      { label: "Temperature rise", value: 18.4, unit: "°C", pct: 100, limit: "Limit 15 °C", status: "Over limit", tone: "over" },
      { label: "Casing swell", value: 3.9, unit: "mm", pct: 100, limit: "Limit 2.0 mm", status: "Over limit", tone: "over" },
    ],
  },
  {
    id: "REG-20261013-005",
    time: "14:09",
    esr: "—",
    powerDraw: "12 mA",
    tempRise: "1.1 °C",
    swell: "2.4 mm",
    diagnosticResult: "recycle",
    processingDecision: "bin-b",
    brand: "Unknown",
    model: "Unknown",
    nominalWeight: 168,
    currentWeight: 168,
    readings: [
      { label: "Battery ESR", value: null, unit: "mΩ", pct: 0, limit: "Limit 250 mΩ", status: "No reading", tone: "measuring" },
      { label: "Power draw", value: 12, unit: "mA", pct: 2, limit: "Range 500 to 800 mA", status: "Below range", tone: "warn" },
      { label: "Temperature rise", value: 1.1, unit: "°C", pct: 7, limit: "Limit 15 °C", status: "Within limit", tone: "ok" },
      { label: "Casing swell", value: 2.4, unit: "mm", pct: 100, limit: "Limit 2.0 mm", status: "Over limit", tone: "over" },
    ],
  },
  {
    id: "REG-20261013-004",
    time: "13:57",
    esr: "412 mΩ",
    powerDraw: "980 mA",
    tempRise: "16.2 °C",
    swell: "4.1 mm",
    diagnosticResult: "disposal",
    processingDecision: "awaiting",
    hasWarning: true,
    brand: "Unknown",
    model: "Unknown",
    nominalWeight: 168,
    currentWeight: 168,
    readings: [
      { label: "Battery ESR", value: 412, unit: "mΩ", pct: 100, limit: "Limit 250 mΩ", status: "Over limit", tone: "over" },
      { label: "Power draw", value: 980, unit: "mA", pct: 100, limit: "Range 500 to 800 mA", status: "Overcurrent", tone: "over" },
      { label: "Temperature rise", value: 16.2, unit: "°C", pct: 100, limit: "Limit 15 °C", status: "Over limit", tone: "over" },
      { label: "Casing swell", value: 4.1, unit: "mm", pct: 100, limit: "Limit 2.0 mm", status: "Over limit", tone: "over" },
    ],
  },
  {
    id: "REG-20261013-003",
    time: "13:44",
    esr: "118 mΩ",
    powerDraw: "710 mA",
    tempRise: "8.3 °C",
    swell: "0.3 mm",
    diagnosticResult: "resellable",
    processingDecision: "bin-a",
    brand: "Unknown",
    model: "Unknown",
    nominalWeight: 168,
    currentWeight: 167,
    readings: [
      { label: "Battery ESR", value: 118, unit: "mΩ", pct: 47, limit: "Limit 250 mΩ", status: "Within limit", tone: "ok" },
      { label: "Power draw", value: 710, unit: "mA", pct: 85, limit: "Range 500 to 800 mA", status: "In range", tone: "ok" },
      { label: "Temperature rise", value: 8.3, unit: "°C", pct: 55, limit: "Limit 15 °C", status: "Within limit", tone: "ok" },
      { label: "Casing swell", value: 0.3, unit: "mm", pct: 15, limit: "Limit 2.0 mm", status: "Within limit", tone: "ok" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Safety alerts
// ---------------------------------------------------------------------------
export const ALERTS_INITIAL: SafetyAlert[] = [
  {
    id: "alert-001",
    deviceId: "REG-20261013-004",
    type: "Battery swelling",
    raisedAt: "REG-20261013-004, raised 13:57",
    description: "Casing swell 4.1 mm, above the 3.5 mm hazard limit. Temperature rise 16.2 °C.",
    status: "open",
  },
  {
    id: "alert-002",
    deviceId: "REG-20261013-006",
    type: "Possible short circuit",
    raisedAt: "REG-20261013-006, raised 14:21",
    description: "Charging draw 1,240 mA, above the expected 500 to 800 mA range.",
    status: "open",
  },
  {
    id: "alert-003",
    deviceId: "REG-20261012-039",
    type: "Thermal rise above limit",
    raisedAt: "REG-20261012-039, raised yesterday 16:40",
    description: "Temperature rise 17.1 °C. Moved to the quarantine shelf by Shift 2.",
    status: "acknowledged",
  },
  {
    id: "alert-004",
    deviceId: "REG-20261012-031",
    type: "Casing swell above limit",
    raisedAt: "REG-20261012-031, resolved today 09:12",
    description: "Casing swell 3.8 mm. Device sorted to Bin C and logged.",
    status: "resolved",
  },
];

// ---------------------------------------------------------------------------
// Hazard checklist
// ---------------------------------------------------------------------------
export const HAZARD_STEPS_INITIAL: HazardStep[] = [
  { id: "h1", label: "Put on gloves and eye protection", done: true },
  { id: "h2", label: "Move the device to the quarantine shelf", done: true },
  { id: "h3", label: "Do not charge or open the device", done: false },
  { id: "h4", label: "Write the device ID on the hazard log", done: false },
  { id: "h5", label: "Tell the shift lead", done: false },
];

// ---------------------------------------------------------------------------
// Device queue (Diagnostics page)
// ---------------------------------------------------------------------------
export const QUEUE: QueueDevice[] = [
  { id: "REG-20261013-009", model: "Smartphone, Model X14" },
  { id: "REG-20261013-010", model: "Smartphone, Model S2" },
  { id: "REG-20261013-011", model: "Smartphone, Model X12" },
  { id: "REG-20261013-012", model: "Smartphone, Model S1" },
];

// ---------------------------------------------------------------------------
// Current test stages (Diagnostics page)
// ---------------------------------------------------------------------------
export const STAGES: Stage[] = [
  { label: "Identify phone", sub: "Brand + model", state: "waiting" },
  { label: "Measure", sub: "At the station", state: "waiting" },
  { label: "Compare", sub: "Against reference", state: "waiting" },
  { label: "Review + save", sub: "Operator action", state: "waiting" },
];

// ---------------------------------------------------------------------------
// Current test readings (Diagnostics page)
// ---------------------------------------------------------------------------
export const CURRENT_READINGS: Reading[] = [
  { label: "Battery ESR", value: null, unit: "mΩ", pct: 0, limit: "Limit 250 mΩ", status: "Measuring", tone: "measuring" },
  { label: "Power draw", value: 610, unit: "mA", pct: 76, limit: "Range 500 to 800 mA", status: "In range", tone: "ok" },
  { label: "Temperature rise", value: 4.2, unit: "°C", pct: 28, limit: "Limit 15 °C", status: "Within limit", tone: "ok" },
  { label: "Casing swell", value: 0.5, unit: "mm", pct: 25, limit: "Limit 2.0 mm", status: "Within limit", tone: "ok" },
];

// ---------------------------------------------------------------------------
// Grading rules table
// ---------------------------------------------------------------------------
export const GRADING_RULES: GradingRule[] = [
  {
    resultKey: "resellable",
    label: "Resellable / Refurbishable",
    weight: "Within 5% of nominal",
    swell: "2.0 mm or less",
    tempRise: "15 °C or less",
    chargeDraw: "Above 500 mA",
    bin: "Bin A",
  },
  {
    resultKey: "recycle",
    label: "Recycle / Safe Dismantling",
    weight: "More than 15% under nominal",
    swell: "More than 2.0 mm",
    tempRise: "15 °C or less",
    chargeDraw: "Below 50 mA",
    bin: "Bin B",
  },
  {
    resultKey: "disposal",
    label: "Disposal",
    weight: "Irregular, with heavy swelling",
    swell: "More than 3.5 mm",
    tempRise: "More than 15 °C",
    chargeDraw: "Short circuit or overcurrent",
    bin: "Bin C",
  },
];
