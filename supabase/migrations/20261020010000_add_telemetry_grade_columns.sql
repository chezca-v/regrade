-- Firmware publishes grade, health_score, and sort_success on every diagnostic
-- report, but station_telemetry had no columns for them, so the MQTT listener
-- discarded them before they ever reached Supabase. Persist them so the
-- dashboard can read a grade once grading thresholds are calibrated.
alter table public.station_telemetry
    add column grade char(1) check (grade is null or grade in ('A', 'B', 'C', 'D')),
    add column health_score numeric(5, 2) check (health_score is null or health_score between 0 and 100),
    add column sort_success boolean;
