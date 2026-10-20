import { createClient } from "@/lib/supabase/server";
import DiagnosticsPage from "../diagnostics";

export const dynamic = "force-dynamic";

export default async function Page() {
  const supabase = await createClient();
  const [{ data, error }, { data: references }] = await Promise.all([
    supabase.from("station_telemetry")
      .select("telemetry_id, station_id, session_id, status, duration_ms, readings, grade, health_score, fault, reported_at")
      .order("reported_at", { ascending: false }).limit(10),
    supabase.from("device_model").select("model_id, brand, model_name, baseline_weight_g, baseline_thickness_mm").eq("device_type", "phone").order("brand"),
  ]);

  if (error) {
    console.error("Failed to load station telemetry:", error.message, error.code);
  }

  return <DiagnosticsPage telemetry={data ?? []} telemetryError={Boolean(error)} references={references ?? []} />;
}
