-- The dashboard is intentionally open. Only sensor telemetry is public;
-- ingestion remains restricted to the server-side service_role key.
create policy "public can read station telemetry"
    on public.station_telemetry for select to anon using (true);

grant select on public.station_telemetry to anon;
