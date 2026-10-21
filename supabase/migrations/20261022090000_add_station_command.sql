-- Lets a signed-in operator request that a station wake up and scan from the
-- dashboard, without requiring the physical START button. cloud/mqtt-listener.py
-- polls this table and relays pending rows to the station's MQTT command topic;
-- it alone marks them delivered, so RLS only needs to allow operators to insert.
create table public.station_command (
    command_id bigint generated always as identity primary key,
    station_id text not null,
    command text not null check (command in ('start')),
    requested_by uuid not null references auth.users(id) on delete cascade,
    requested_at timestamptz not null default now(),
    delivered_at timestamptz
);

create index station_command_pending_idx
    on public.station_command (requested_at)
    where delivered_at is null;

alter table public.station_command enable row level security;

create policy "authenticated operators can request a station command"
    on public.station_command for insert to authenticated
    with check (requested_by = (select auth.uid()));

revoke all on public.station_command from anon, authenticated;
grant insert (station_id, command, requested_by) on public.station_command to authenticated;
grant usage, select on sequence public.station_command_command_id_seq to authenticated;
grant all on public.station_command to service_role;
