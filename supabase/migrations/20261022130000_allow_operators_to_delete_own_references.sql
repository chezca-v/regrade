-- Operators may remove only references they added themselves. Catalog rows
-- remain protected from deletion.
create policy "operators can delete their own added references"
    on public.device_model for delete to authenticated
    using (
        source = 'operator-added'
        and created_by = (select auth.uid())
    );

grant delete on public.device_model to authenticated;

-- The public reference list can display whether a row was operator-added;
-- ownership identifiers remain private to authenticated sessions.
grant select (source) on public.device_model to anon;
