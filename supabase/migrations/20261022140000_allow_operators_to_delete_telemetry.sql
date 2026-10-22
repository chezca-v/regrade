-- Dashboard operators can remove erroneous station readings from the recent
-- readings list. Deleting a telemetry row also cascades to linked operator
-- diagnoses, as defined by the operator_diagnosis foreign key.
create policy "authenticated operators can delete station telemetry"
    on public.station_telemetry for delete to authenticated
    using (true);

grant delete on public.station_telemetry to authenticated;
