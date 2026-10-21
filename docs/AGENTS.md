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

The dashboard uses `station_telemetry` for received station reports and
`operator_diagnosis` for the signed-in operator's saved review. Sorting,
Safety Alerts, and Settings remain mock workflows; do not imply they persist
to Supabase. The normalized schema (`test_session`, `sensor_reading`,
`grade_result`, `sort_action`, `alert`, `grading_rule_set`) was dropped in
migration `20261020020000` because firmware had no writer for it.

1. **Diagnostics Screen (`/diagnostics`)**:
   - Location: `dashboard/app/diagnostics/page.tsx` (Server Component) +
     `dashboard/app/diagnostics.tsx` (presentational).
   - Queries `station_telemetry` and phone references. New diagnostic flow
     requires selecting a saved phone reference, then instructs the operator
     to press the physical station START button. It polls for a new report;
     only readings with `readings.stable = true` are displayed or saved.
   - Saving requires an authenticated operator and writes the model reference
     and disposition to `operator_diagnosis`. This is an operator review, not
     a firmware grade or safety determination.

2. **Inventory Dashboard (`/inventory`)**:
   - Location: `dashboard/app/inventory/page.tsx` and
     `dashboard/app/inventory.tsx`. Queries station telemetry and the current
     operator's saved dispositions. Lists actual station/session IDs, status,
     selected model reference, and stable readings only; no mock classifications.
   - Filtering and search operate on the returned reports. Rows link to the
     corresponding Device Detail page.

3. **Device Detail Screen (`/inventory/[id]`)**:
   - Location: `dashboard/app/inventory/[id]/page.tsx`. Loads the actual
     station report and the current operator's associated review by session ID.
     Missing sessions return not-found; they do not render sample records.
   - Raw readings and firmware grade are hidden unless `readings.stable` is
     true. The phone model is shown only when a saved operator review links it.

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

6. **Overview and Reports (`/overview`, `/reports`)**:
   - Read station reports and the current operator's own dispositions through
     `dashboard/lib/diagnostic-records.ts`. Counts and exports are derived from
     those records. Disposition labels are operator decisions, not automatic
     classifications. Reports do not expose unstable raw readings.

7. **Settings Screen (`/settings`)**:
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
