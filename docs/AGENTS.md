# Documentation Guidelines

These instructions apply to files under `docs/`. Follow the repository-wide
guidance in [`../CLAUDE.md`](../CLAUDE.md) as well.

## Accuracy and scope

- Distinguish current implementation from planned work. Sensor acquisition
  needs station calibration; grading thresholds and sorter actuation remain
  unavailable. The MQTT listener can persist telemetry when configured.
- Describe ReGrade as a non-destructive smartphone and 5 V USB charger triage
  prototype. Do not imply that its external measurements diagnose battery
  cells or establish that a device is safe.
- State that the MQTT listener logs and persists telemetry using a server-only
  Supabase key, while public dashboard reads are limited to station telemetry
  by RLS.
- Treat `supabase/migrations/` as the canonical schema. Keep the ERD,
  architecture, and README aligned when entities, relationships, access
  policies, or data flows change.
- Keep [`OUTSTANDING_WORK.md`](OUTSTANDING_WORK.md) current when a tracked gap
  closes or a new one is found. It is the single list of what's not done yet;
  don't let implementation-status claims drift from it the way the old
  "Implementation History" section below once did.
- Preserve safety boundaries: no manual battery disassembly, no unreviewed
  electrical stimulus, and no unvalidated automatic sorting.

## Writing and diagrams

- Use concise Markdown, descriptive headings, and consistent terminology from
  the README and architecture document.
- Keep Mermaid diagrams syntactically valid and consistent with implemented
  data flows. Mark planned integrations explicitly, for example with dotted
  arrows or a clear note.
- Keep instructions actionable and include the correct working directory for
  commands. Never include real credentials, tokens, personal device
  identifiers, or private connection details.
- Link to existing documents instead of copying large overlapping sections.
- Preserve existing README styling and requested placeholders when editing it;
  do not replace project content with a generic template.

## Validation

- For documentation-only edits, check links and consistency against relevant
  source/configuration files; no build is needed unless documentation tooling
  is affected.
- For docs changed alongside code or configuration, run the relevant checks
  described in the root `CLAUDE.md` and report exactly what ran.

## Implementation History: Dashboard Screens & Routes

The following dashboard screens and routes have pixel-perfect layouts and
responsive design in `dashboard/`. Only **Diagnostics** and **Reference
Weights** read live Supabase data; the rest render from local mock state
(`dashboard/lib/rg-data.ts` or inline constants) and say so in their page
copy ("Sample data"). An earlier version of this section claimed live
Supabase wiring for Inventory, Device Detail, and Sorting; that was
aspirational and did not match the code, since the normalized schema those
pages queried (`test_session`, `sensor_reading`, `grade_result`,
`sort_action`, `alert`, `grading_rule_set`) had no writer and was dropped in
migration `20261020020000`. Keep this list honest as screens change.

1. **Diagnostics Screen (`/diagnostics`)**:
   - Location: `dashboard/app/diagnostics/page.tsx` (Server Component) +
     `dashboard/app/diagnostics.tsx` (presentational).
   - "Latest station readings" table is live: it queries `station_telemetry`
     (including `grade` and `health_score`) ordered by `reported_at`. The rest
     of the page (current test stepper, grading-rules reference table, device
     queue) is still local mock state.

2. **Inventory Dashboard (`/inventory`)**:
   - Location: `dashboard/app/inventory/page.tsx` (re-exported via
     `dashboard/app/inventory.tsx`). Entirely local mock state
     (`INVENTORY_DATA`); not wired to Supabase.
   - Summary KPI cards (*Devices on record*, *Awaiting verification*, *Resellable / Refurbishable*, *Disposal*).
   - Dynamic audit log data table with segmented filtering tabs (*All devices*, *Resellable*, *Recycle*, *Disposal*, *Needs verification*), search by device ID, and time range selection.
   - Row-level alert indicators with warning background highlights for disposal devices (e.g., `REG-20261013-004`).
   - Row click navigation routing directly to the corresponding Device Detail page.

3. **Device Detail Screen (`/inventory/[id]`)**:
   - Location: `dashboard/app/inventory/[id]/page.tsx`.
   - Server Component that queries `station_telemetry` by `session_id` (the
     URL parameter). Inventory's mock row IDs (e.g. `REG-20261013-004`) do not
     match real firmware-generated session IDs, so navigating from the mock
     Inventory list will show the placeholder fallback until a real session
     uses that exact ID; this is expected given Inventory itself is still mock.
   - Only fields the firmware actually reports are shown: `status`, `grade`,
     `health_score`, `fault`, and the four `readings` values. There is no
     stored device model, per-check threshold flags, bin, or activity
     timeline for a telemetry row, so those sections render honestly reduced
     content (e.g. "No per-reading limit is persisted for this station
     report") instead of fabricated values.
   - Safety Alert banner shown only when `grade = 'D'`.

4. **Sorting Screen (`/sorting`)**:
   - Location: `dashboard/app/sorting/page.tsx` (re-exported via
     `dashboard/app/sorting.tsx`). Entirely local mock state (`"use client"`,
     `useState`); not wired to Supabase. There are no Server Actions and no
     `sort_action` table (dropped in `20261020020000`) — operator "Verify and
     route" / "Override" actions here only mutate component state and are
     lost on refresh.

5. **Reference Weights Screen (`/diagnostics/reference-weights`)**:
   - Location: `dashboard/app/diagnostics/reference-weights/page.tsx` & `table-client.tsx`.
   - Diagnostics Server Component fetching device model specifications from `device_model`.
   - Dynamic threshold calculations for accepted tolerance (±5% nominal) and recycle thresholds (< −15% nominal).
   - Brand filtering dropdown and model search with responsive table pagination.

6. **Settings Screen (`/settings`)**:
   - Location: `dashboard/app/settings/page.tsx`. Entirely local mock state;
     not wired to Supabase, and its own copy says so ("Sample data mode",
     "Not connected").
   - Active settings icon navigation in the top action bar.
   - Interactive notification toggles (safety alert pop-ups, disposal sounds, verification reminders, daily summaries).
   - Display configuration dropdowns (weight units, temperature units, time format, language).
   - Data source card with sample mode toggle and read-only grading limits reference.

7. **Diagnostics Reference Weights & Phone Model Seeding**:
   - Ingested and normalized verified mobile phone specifications from the GSMArena dataset (`arwinneil/gsmarena-phone-dataset`) and 2020–2025 Mobiles Dataset (`abdulmalik1518/mobiles-dataset-2025`).
   - Generated database migration `supabase/migrations/20261015170000_seed_phone_reference_weights.sql` and `supabase/seed.sql` populating `public.device_model` with 7,767 unique verified smartphone models with baseline weights (`baseline_weight_g`), physical thickness (`baseline_thickness_mm`), and `ON CONFLICT (brand, model_name, device_type)` upserts.
   - Updated the Reference Weights screen (`dashboard/app/diagnostics/reference-weights/page.tsx` & `table-client.tsx`) to display 52 curated authentic smartphones (Apple iPhone 16/15/14/13/12/11/SE, Samsung Galaxy S24/S23/S22/A54/A34/Z Flip, Google Pixel 9/8/7/6, OnePlus 12/11, Xiaomi 14, Motorola Edge, Sony Xperia) with exact nominal weights and calculated tolerance ranges (accepted ±5%, recycle <85%).
   - Restored and polished the layout styling for `/settings` and `/diagnostics/reference-weights` matching ReGrade visual tokens and top navigation.
   - Verified complete production build (`npm run build`) with zero TypeScript errors.

