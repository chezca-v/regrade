export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      app_user: Table<{
        operator_id: number;
        auth_user_id: string;
        name: string;
        role: string;
        email: string;
        created_at: string;
      }>;
      device_model: Table<{
        model_id: number;
        brand: string;
        model_name: string;
        device_type: "phone" | "charger";
        baseline_weight_g: number;
        baseline_thickness_mm: number | null;
        nominal_current_ma: number | null;
          source?: "catalog" | "operator-added";
          created_by?: string | null;
      }>;
      station_telemetry: Table<{
        telemetry_id: number;
        station_id: string;
        session_id: string;
        status: string;
        duration_ms: number | null;
        readings: Json;
        fault: string | null;
        grade: "A" | "B" | "C" | "D" | null;
        health_score: number | null;
        sort_success: boolean | null;
        reported_at: string;
      }>;
      operator_diagnosis: Table<{
        diagnosis_id: number;
        telemetry_id: number;
        operator_id: string;
        device_model_id: number | null;
        decision: "resellable" | "recycle" | "disposal" | "needs-review";
        notes: string | null;
        created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
