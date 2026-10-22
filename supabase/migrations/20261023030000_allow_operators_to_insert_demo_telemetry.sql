-- Lets a signed-in operator post a demo-station diagnostic row directly from
-- the dashboard (no physical station or MQTT listener involved), so the
-- exhibit flow still lands in station_telemetry/Inventory/Reports like a real
-- diagnostic. Genuine station telemetry still only arrives through the
-- server-side service_role key (see 20261018010000_allow_public_station_
-- telemetry_read.sql); this policy is scoped to station ids ending in
-- "-demo" so it can never collide with, or be mistaken for, a real station's
-- rows.
create policy "authenticated operators can insert demo station telemetry"
    on public.station_telemetry for insert to authenticated
    with check (station_id like '%-demo');

create policy "authenticated operators can update demo station telemetry"
    on public.station_telemetry for update to authenticated
    using (station_id like '%-demo')
    with check (station_id like '%-demo');

grant insert (station_id, session_id, status, duration_ms, readings, fault, grade, health_score, sort_success)
    on public.station_telemetry to authenticated;
grant update (status, duration_ms, readings, fault, grade, health_score, sort_success)
    on public.station_telemetry to authenticated;
grant usage, select on sequence public.station_telemetry_telemetry_id_seq to authenticated;
