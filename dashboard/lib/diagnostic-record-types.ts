import type { Database, Json } from "@/lib/database.types";

type Telemetry = Database["public"]["Tables"]["station_telemetry"]["Row"];
type Review = Database["public"]["Tables"]["operator_diagnosis"]["Row"];
type PhoneReference = Database["public"]["Tables"]["device_model"]["Row"];

export type DiagnosticRecord = Telemetry & {
  review: Pick<Review, "decision" | "device_model_id" | "notes" | "created_at"> | null;
  phoneReference: Pick<PhoneReference, "brand" | "model_name" | "baseline_weight_g" | "baseline_thickness_mm"> | null;
};

export function getReadings(readings: Json): Record<string, Json | undefined> {
  return readings !== null && typeof readings === "object" && !Array.isArray(readings)
    ? readings
    : {};
}

export function isStableRecord(record: Pick<DiagnosticRecord, "readings">): boolean {
  return getReadings(record.readings).stable === true;
}
