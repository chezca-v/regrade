-- The diagnostics page now lets an operator add a charger reference inline,
-- the same way it already allowed phone references. Authenticated read access
-- to all device_model rows (any device_type) already existed since the
-- initial schema; this only widens the insert check used by that form.
drop policy "authenticated operators can add phone references" on public.device_model;

create policy "authenticated operators can add device references"
    on public.device_model for insert to authenticated
    with check (
        device_type in ('phone', 'charger')
        and source = 'operator-added'
        and created_by = (select auth.uid())
    );
