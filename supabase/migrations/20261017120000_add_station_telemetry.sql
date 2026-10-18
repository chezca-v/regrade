create table public.station_telemetry (
    telemetry_id bigint generated always as identity primary key,
    station_id text not null,
    session_id text not null,
    status text not null,
    duration_ms integer check (duration_ms is null or duration_ms >= 0),
    readings jsonb not null default '{}'::jsonb,
    fault text,
    reported_at timestamptz not null default current_timestamp,
    unique (station_id, session_id)
);

create index station_telemetry_reported_at_idx
    on public.station_telemetry (reported_at desc);

alter table public.station_telemetry enable row level security;
create policy "authenticated operators can read station telemetry"
    on public.station_telemetry for select to authenticated using (true);
revoke all on public.station_telemetry from anon, authenticated;
grant select on public.station_telemetry to authenticated;
grant all on public.station_telemetry to service_role;
grant usage, select on sequence public.station_telemetry_telemetry_id_seq to service_role;
