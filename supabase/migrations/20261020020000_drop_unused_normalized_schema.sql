-- The initial schema (20261012230000) modeled a normalized triage pipeline
-- (test_session, sensor_reading, grade_result, sort_action, alert,
-- grading_rule_set, station, device_unit) alongside dashboard_diagnostics.
-- Nothing in firmware/ or cloud/ ever writes to these tables: the firmware
-- publishes flat diagnostic reports over MQTT, and the listener persists them
-- to station_telemetry instead. The dashboard's device detail page queried
-- these tables anyway and always fell through to hardcoded placeholder data
-- because they were permanently empty.
--
-- device_model and app_user are kept: device_model is populated by the
-- reference-weights seed migration and read by the Reference Weights screen,
-- and app_user is populated by the on_auth_user_created trigger tied to real
-- Supabase Auth sign-ups.
drop view if exists public.dashboard_diagnostics;
drop table if exists public.alert;
drop table if exists public.sort_action;
drop table if exists public.grade_result;
drop table if exists public.sensor_reading;
drop table if exists public.test_session;
drop table if exists public.grading_rule_set;
drop table if exists public.bin;
drop table if exists public.station;
drop table if exists public.device_unit;
