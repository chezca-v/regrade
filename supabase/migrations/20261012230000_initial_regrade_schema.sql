create table public.app_user (
    operator_id bigint generated always as identity primary key,
    auth_user_id uuid not null unique references auth.users(id) on delete cascade,
    name text not null,
    role text not null default 'operator'
        check (role in ('operator', 'reviewer', 'admin')),
    email text not null unique,
    created_at timestamptz not null default current_timestamp
);

create table public.device_model (
    model_id bigint generated always as identity primary key,
    brand text not null,
    model_name text not null,
    device_type text not null check (device_type in ('phone', 'charger')),
    baseline_weight_g numeric(8, 2) not null check (baseline_weight_g > 0),
    baseline_thickness_mm numeric(6, 2) check (baseline_thickness_mm > 0),
    nominal_current_ma numeric(8, 2) check (nominal_current_ma >= 0),
    unique (brand, model_name, device_type)
);

create table public.device_unit (
    unit_id bigint generated always as identity primary key,
    model_id bigint not null references public.device_model(model_id),
    serial_or_imei text unique,
    received_at timestamptz not null default current_timestamp,
    source_note text
);

create table public.station (
    station_id text primary key,
    name text not null,
    firmware_version text not null,
    last_seen_at timestamptz
);

create table public.bin (
    bin_id bigint generated always as identity primary key,
    label text not null unique,
    grade_category text not null
        check (grade_category in ('refurbish', 'recycle', 'dispose')),
    capacity integer check (capacity is null or capacity >= 0)
);

create table public.grading_rule_set (
    rule_version_id bigint generated always as identity primary key,
    weight_min_pct numeric(6, 3) not null check (weight_min_pct >= 0),
    thickness_swell_mm numeric(6, 2) not null check (thickness_swell_mm >= 0),
    thickness_missing_mm numeric(6, 2) not null check (thickness_missing_mm >= 0),
    overcurrent_ma numeric(8, 2) not null check (overcurrent_ma > 0),
    zero_current_ma numeric(8, 2) not null check (zero_current_ma >= 0),
    temp_rise_c numeric(6, 2) not null check (temp_rise_c > 0),
    created_by bigint not null references public.app_user(operator_id),
    created_at timestamptz not null default current_timestamp,
    is_active boolean not null default false
);

create table public.test_session (
    session_id bigint generated always as identity primary key,
    unit_id bigint not null references public.device_unit(unit_id),
    station_id text not null references public.station(station_id),
    operator_id bigint not null references public.app_user(operator_id),
    test_mode text not null,
    started_at timestamptz not null default current_timestamp,
    duration_ms integer check (duration_ms is null or duration_ms >= 0),
    status text not null
);

create table public.sensor_reading (
    reading_id bigint generated always as identity primary key,
    session_id bigint not null
        references public.test_session(session_id) on delete cascade,
    sensor_type text not null,
    value numeric(14, 4) not null,
    unit text not null,
    sampled_at timestamptz not null default current_timestamp
);

create table public.grade_result (
    result_id bigint generated always as identity primary key,
    session_id bigint not null unique
        references public.test_session(session_id) on delete cascade,
    final_grade char(1) not null check (final_grade in ('A', 'B', 'C', 'D')),
    weight_flag text not null,
    thickness_flag text not null,
    current_flag text not null,
    temp_flag text not null,
    health_score numeric(5, 2) check (health_score between 0 and 100),
    rule_version_id bigint not null
        references public.grading_rule_set(rule_version_id)
);

create table public.sort_action (
    sort_id bigint generated always as identity primary key,
    session_id bigint not null unique
        references public.test_session(session_id) on delete cascade,
    bin_id bigint not null references public.bin(bin_id),
    servo_angle smallint not null check (servo_angle between 0 and 180),
    executed_at timestamptz not null default current_timestamp,
    success boolean not null
);

create table public.alert (
    alert_id bigint generated always as identity primary key,
    session_id bigint not null
        references public.test_session(session_id) on delete cascade,
    type text not null,
    severity text not null,
    message text not null,
    created_at timestamptz not null default current_timestamp
);

create index sensor_reading_session_sampled_idx
    on public.sensor_reading (session_id, sampled_at);
create index test_session_started_at_idx
    on public.test_session (started_at desc);
create index alert_session_created_idx
    on public.alert (session_id, created_at desc);

create function public.create_operator_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.app_user (auth_user_id, name, email)
    values (
        new.id,
        coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
        new.email
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.create_operator_profile();

create view public.dashboard_diagnostics
with (security_invoker = true)
as
select
    ts.session_id,
    ts.started_at,
    ts.duration_ms,
    ts.status,
    s.station_id,
    s.name as station_name,
    s.firmware_version,
    s.last_seen_at as station_last_seen_at,
    dm.brand,
    dm.model_name,
    dm.device_type,
    gr.final_grade,
    gr.health_score
from public.test_session as ts
join public.station as s on s.station_id = ts.station_id
join public.device_unit as du on du.unit_id = ts.unit_id
join public.device_model as dm on dm.model_id = du.model_id
left join public.grade_result as gr on gr.session_id = ts.session_id;

alter table public.app_user enable row level security;
alter table public.device_model enable row level security;
alter table public.device_unit enable row level security;
alter table public.station enable row level security;
alter table public.bin enable row level security;
alter table public.grading_rule_set enable row level security;
alter table public.test_session enable row level security;
alter table public.sensor_reading enable row level security;
alter table public.grade_result enable row level security;
alter table public.sort_action enable row level security;
alter table public.alert enable row level security;

create policy "operators can read their own profile"
    on public.app_user for select to authenticated
    using (auth_user_id = (select auth.uid()));

create policy "authenticated operators can read device models"
    on public.device_model for select to authenticated using (true);
create policy "authenticated operators can read device units"
    on public.device_unit for select to authenticated using (true);
create policy "authenticated operators can read stations"
    on public.station for select to authenticated using (true);
create policy "authenticated operators can read bins"
    on public.bin for select to authenticated using (true);
create policy "authenticated operators can read grading rules"
    on public.grading_rule_set for select to authenticated using (true);
create policy "authenticated operators can read sessions"
    on public.test_session for select to authenticated using (true);
create policy "authenticated operators can read sensor readings"
    on public.sensor_reading for select to authenticated using (true);
create policy "authenticated operators can read grades"
    on public.grade_result for select to authenticated using (true);
create policy "authenticated operators can read sort actions"
    on public.sort_action for select to authenticated using (true);
create policy "authenticated operators can read alerts"
    on public.alert for select to authenticated using (true);

revoke all on public.app_user, public.device_model, public.device_unit,
    public.station, public.bin, public.grading_rule_set, public.test_session,
    public.sensor_reading, public.grade_result, public.sort_action, public.alert
    from anon, authenticated;
revoke all on public.dashboard_diagnostics from anon, authenticated;
revoke all on function public.create_operator_profile() from public, anon, authenticated;

grant select (operator_id, auth_user_id, name, role, created_at)
    on public.app_user to authenticated;
grant select on public.device_model to authenticated;
grant select (unit_id, model_id, received_at) on public.device_unit to authenticated;
grant select on public.station to authenticated;
grant select on public.bin to authenticated;
grant select on public.grading_rule_set to authenticated;
grant select (session_id, unit_id, station_id, test_mode, started_at, duration_ms, status)
    on public.test_session to authenticated;
grant select on public.sensor_reading to authenticated;
grant select on public.grade_result to authenticated;
grant select on public.sort_action to authenticated;
grant select on public.alert to authenticated;
grant select on public.dashboard_diagnostics to authenticated;
