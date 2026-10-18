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
      }>;
      device_unit: Table<{
        unit_id: number;
        model_id: number;
        serial_or_imei: string | null;
        received_at: string;
        source_note: string | null;
      }>;
      station: Table<{
        station_id: string;
        name: string;
        firmware_version: string;
        last_seen_at: string | null;
      }>;
      bin: Table<{
        bin_id: number;
        label: string;
        grade_category: "refurbish" | "recycle" | "dispose";
        capacity: number | null;
      }>;
      grading_rule_set: Table<{
        rule_version_id: number;
        weight_min_pct: number;
        thickness_swell_mm: number;
        thickness_missing_mm: number;
        overcurrent_ma: number;
        zero_current_ma: number;
        temp_rise_c: number;
        created_by: number;
        created_at: string;
        is_active: boolean;
      }>;
      test_session: Table<{
        session_id: number;
        unit_id: number;
        station_id: string;
        operator_id: number;
        test_mode: string;
        started_at: string;
        duration_ms: number | null;
        status: string;
      }>;
      sensor_reading: Table<{
        reading_id: number;
        session_id: number;
        sensor_type: string;
        value: number;
        unit: string;
        sampled_at: string;
      }>;
      grade_result: Table<{
        result_id: number;
        session_id: number;
        final_grade: "A" | "B" | "C" | "D";
        weight_flag: string;
        thickness_flag: string;
        current_flag: string;
        temp_flag: string;
        health_score: number | null;
        rule_version_id: number;
      }>;
      sort_action: Table<{
        sort_id: number;
        session_id: number;
        bin_id: number;
        servo_angle: number;
        executed_at: string;
        success: boolean;
      }>;
      alert: Table<{
        alert_id: number;
        session_id: number;
        type: string;
        severity: string;
        message: string;
        created_at: string;
      }>;
      station_telemetry: Table<{
        telemetry_id: number;
        station_id: string;
        session_id: string;
        status: string;
        duration_ms: number | null;
        readings: Json;
        fault: string | null;
        reported_at: string;
      }>;
    };
    Views: {
      dashboard_diagnostics: {
        Row: {
          session_id: number;
          started_at: string;
          duration_ms: number | null;
          status: string;
          station_id: string;
          station_name: string;
          firmware_version: string;
          station_last_seen_at: string | null;
          brand: string;
          model_name: string;
          device_type: "phone" | "charger";
          final_grade: "A" | "B" | "C" | "D" | null;
          health_score: number | null;
        };
        Relationships: [];
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
