import { createClient } from "@/lib/supabase/server";
import DiagnosticsPage from "../diagnostics";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const [{ data, error }, { data: references, error: referenceError }, { data: { user }, error: userError }] = await Promise.all([
    supabase.from("station_telemetry")
      .select("telemetry_id, station_id, session_id, status, duration_ms, readings, grade, health_score, fault, reported_at")
      .order("reported_at", { ascending: false }).limit(10),
    supabase.from("device_model").select("model_id, brand, model_name, baseline_weight_g, baseline_thickness_mm").eq("device_type", "phone").order("brand"),
    supabase.auth.getUser(),
  ]);

  if (error) {
    console.error("Failed to load station telemetry:", error.message, error.code);
  }
  if (referenceError) {
    console.error("Failed to load phone references:", referenceError.message, referenceError.code);
  }
  if (userError) {
    console.error("Failed to identify dashboard operator:", userError.message);
  }

  const { data: reviews, error: reviewError } = user
    ? await supabase.from("operator_diagnosis").select("telemetry_id").eq("operator_id", user.id)
    : { data: [], error: null };
  if (reviewError) {
    console.error("Failed to load saved diagnoses:", reviewError.message, reviewError.code);
  }

  return <DiagnosticsPage
    telemetry={data ?? []}
    telemetryError={Boolean(error)}
    referenceError={Boolean(referenceError)}
    savedReviewError={Boolean(reviewError || userError)}
    references={references ?? []}
    savedTelemetryIds={(reviews ?? []).map((review) => review.telemetry_id)}
  />;
}
