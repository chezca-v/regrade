import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import DiagnosticsPage from "../diagnostics";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const [{ data, error }, { data: firstReferencePage, error: firstReferenceError }, { data: { user: rawUser }, error: rawUserError }] = await Promise.all([
    supabase.from("station_telemetry")
      .select("telemetry_id, station_id, session_id, status, duration_ms, readings, grade, health_score, fault, reported_at")
      .neq("status", "scanning")
      .order("reported_at", { ascending: false }).limit(10),
    supabase.from("device_model").select("model_id, brand, model_name, device_type, baseline_weight_g, baseline_thickness_mm, source").in("device_type", ["phone", "charger"]).order("brand").range(0, 999),
    supabase.auth.getUser(),
  ]);

  const references = firstReferencePage ?? [];
  let referenceError = firstReferenceError;
  let lastReferencePageLength = firstReferencePage?.length ?? 0;
  let referenceOffset = 1000;
  while (!referenceError && lastReferencePageLength === 1000) {
    const { data: nextPage, error: nextPageError } = await supabase
      .from("device_model")
      .select("model_id, brand, model_name, device_type, baseline_weight_g, baseline_thickness_mm, source")
      .in("device_type", ["phone", "charger"])
      .order("brand")
      .range(referenceOffset, referenceOffset + 999);
    if (nextPageError) {
      referenceError = nextPageError;
      break;
    }
    references.push(...(nextPage ?? []));
    lastReferencePageLength = nextPage?.length ?? 0;
    referenceOffset += 1000;
  }

  // getUser() errors even for the ordinary case of a visitor with no session
  // at all (AuthSessionMissingError); that is not a failure worth reporting.
  const userError = rawUserError && !isAuthSessionMissingError(rawUserError) ? rawUserError : null;
  const user = rawUserError ? null : rawUser;

  if (error) {
    console.error("Failed to load station telemetry:", error.message, error.code);
  }
  if (referenceError) {
    console.error("Failed to load device references:", referenceError.message, referenceError.code);
  }
  if (userError) {
    console.error("Failed to identify dashboard operator:", userError.message);
  }

  const { data: reviews, error: reviewError } = user
    ? await supabase.from("operator_diagnosis").select("telemetry_id, device_model_id").eq("operator_id", user.id)
    : { data: [], error: null };
  if (reviewError) {
    console.error("Failed to load saved diagnoses:", reviewError.message, reviewError.code);
  }

  const modelIds = [...new Set((reviews ?? []).flatMap((review) => review.device_model_id === null ? [] : [review.device_model_id]))];
  const { data: reviewedModels, error: reviewedModelsError } = modelIds.length > 0
    ? await supabase.from("device_model").select("model_id, brand, model_name").in("model_id", modelIds)
    : { data: [], error: null };
  if (reviewedModelsError) {
    console.error("Failed to load reference names for saved diagnoses:", reviewedModelsError.message, reviewedModelsError.code);
  }
  const modelNameById = new Map((reviewedModels ?? []).map((model) => [model.model_id, `${model.brand} ${model.model_name}`]));
  const deviceReferenceByTelemetry = new Map((reviews ?? []).flatMap((review) => {
    const modelName = review.device_model_id === null ? undefined : modelNameById.get(review.device_model_id);
    return modelName ? [[review.telemetry_id, modelName] as const] : [];
  }));

  return <DiagnosticsPage
    telemetry={(data ?? []).map((record) => ({
      ...record,
      device_reference: deviceReferenceByTelemetry.get(record.telemetry_id) ?? null,
    }))}
    telemetryError={Boolean(error)}
    referenceError={Boolean(referenceError)}
    savedReviewError={Boolean(reviewError || userError)}
    references={references ?? []}
    savedTelemetryIds={(reviews ?? []).map((review) => review.telemetry_id)}
  />;
}
