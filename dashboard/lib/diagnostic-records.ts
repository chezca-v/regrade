import { isAuthSessionMissingError } from "@supabase/supabase-js";
import type { DiagnosticRecord } from "@/lib/diagnostic-record-types";
import { createClient } from "@/lib/supabase/server";

export type { DiagnosticRecord } from "@/lib/diagnostic-record-types";

export async function loadDiagnosticRecords(): Promise<DiagnosticRecord[]> {
  const supabase = await createClient();
  const [{ data: userData, error: userError }, { data: telemetry, error: telemetryError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("station_telemetry")
      .select("telemetry_id, station_id, session_id, status, duration_ms, readings, grade, health_score, fault, sort_success, reported_at")
      .order("reported_at", { ascending: false })
      .limit(500),
  ]);

  // getUser() errors even for the ordinary case of a visitor with no session
  // at all (AuthSessionMissingError); treat only other auth errors as fatal.
  if (userError && !isAuthSessionMissingError(userError)) {
    throw new Error(`Failed to identify dashboard operator: ${userError.message}`);
  }
  if (telemetryError) throw new Error(`Failed to load station telemetry: ${telemetryError.message}`);
  if (!telemetry) return [];

  const user = userError ? null : userData.user;
  const { data: reviews, error: reviewError } = user
    ? await supabase.from("operator_diagnosis")
      .select("telemetry_id, decision, device_model_id, notes, created_at")
      .eq("operator_id", user.id)
    : { data: [], error: null };
  if (reviewError) throw new Error(`Failed to load saved operator diagnoses: ${reviewError.message}`);

  const modelIds = [...new Set((reviews ?? []).flatMap((review) => review.device_model_id === null ? [] : [review.device_model_id]))];
  const { data: models, error: modelError } = modelIds.length
    ? await supabase.from("device_model")
      .select("model_id, brand, model_name, device_type, baseline_weight_g, baseline_thickness_mm, nominal_current_ma, source, created_by")
      .in("model_id", modelIds)
    : { data: [], error: null };
  if (modelError) throw new Error(`Failed to load phone reference records: ${modelError.message}`);

  const reviewsByTelemetry = new Map((reviews ?? []).map((review) => [review.telemetry_id, review]));
  const modelsById = new Map((models ?? []).map((model) => [model.model_id, model]));

  return telemetry.map((record) => {
    const review = reviewsByTelemetry.get(record.telemetry_id) ?? null;
    const model = review?.device_model_id === null || review?.device_model_id === undefined
      ? null
      : modelsById.get(review.device_model_id) ?? null;
    return {
      ...record,
      review,
      phoneReference: model,
    };
  });
}
