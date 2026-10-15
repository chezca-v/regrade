# Documentation Guidelines

These instructions apply to files under `docs/`. Follow the repository-wide
guidance in [`../CLAUDE.md`](../CLAUDE.md) as well.

## Accuracy and scope

- Distinguish current implementation from planned work. The ESP32 sensor reads,
  calibrated grading thresholds, sorter actuation, MQTT persistence, and
  backend API are not implemented unless code and validation demonstrate
  otherwise.
- Describe ReGrade as a non-destructive smartphone and 5 V USB charger triage
  prototype. Do not imply that its external measurements diagnose battery
  cells or establish that a device is safe.
- State that the MQTT listener logs telemetry only and that the dashboard
  reads Supabase directly using authenticated, read-only access and RLS.
- Treat `supabase/migrations/` as the canonical schema. Keep the ERD,
  architecture, and README aligned when entities, relationships, access
  policies, or data flows change.
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

The following dashboard screens and routes have been implemented in `dashboard/` with pixel-perfect layouts, responsive design, and live Supabase integration:

1. **Inventory Dashboard (`/inventory`)**:
   - Location: `dashboard/app/inventory/page.tsx` (re-exported via `dashboard/inventory.tsx`).
   - Summary KPI cards (*Devices on record*, *Awaiting verification*, *Resellable / Refurbishable*, *Disposal*).
   - Dynamic audit log data table with segmented filtering tabs (*All devices*, *Resellable*, *Recycle*, *Disposal*, *Needs verification*), search by device ID, and time range selection.
   - Row-level alert indicators with warning background highlights for disposal devices (e.g., `REG-20261013-004`).
   - Row click navigation routing directly to the corresponding Device Detail page.

2. **Device Detail Screen (`/inventory/[id]`)**:
   - Location: `dashboard/app/inventory/[id]/page.tsx`.
   - Dynamic Server Component fetching live triage records, sensor readings, grading rules, and alerts from Supabase using the URL parameter.
   - Safety Alert banner with glove handling and quarantine instructions.
   - Full sensor readings grid (Battery ESR, Power draw, Temperature rise, Casing swell) with limit bars and warning statuses.
   - "Why this result" rule violation explanation and chronological activity timeline.
   - Decision card with suggested bin routing and operator action controls.
   - Device metadata specifications card (model, nominal/measured weight, batch, received timestamp, collection center).

3. **Sorting Screen (`/sorting`)**:
   - Location: `dashboard/app/sorting/page.tsx`.
   - Server Component displaying 3-column bin capacity cards (Bin A Resellable, Bin B Recycle, Bin C Disposal) with dynamic progress bars, collection schedules, and hazard alerts.
   - Routing queue data table showing devices awaiting verification.
   - Server Actions (`verifyAndRouteAction` and `overrideAction`) to record operator decisions and sort actions in Supabase with path revalidation.

4. **Reference Weights Screen (`/diagnostics/reference-weights`)**:
   - Location: `dashboard/app/diagnostics/reference-weights/page.tsx` & `table-client.tsx`.
   - Diagnostics Server Component fetching device model specifications from `device_model`.
   - Dynamic threshold calculations for accepted tolerance (±5% nominal) and recycle thresholds (< −15% nominal).
   - Brand filtering dropdown and model search with responsive table pagination.

5. **Settings Screen (`/settings`)**:
   - Location: `dashboard/app/settings/page.tsx`.
   - Active settings icon navigation in the top action bar.
   - Interactive notification toggles (safety alert pop-ups, disposal sounds, verification reminders, daily summaries).
   - Display configuration dropdowns (weight units, temperature units, time format, language).
   - Data source card with sample mode toggle and read-only grading limits reference.

6. **Diagnostics Reference Weights & Phone Model Seeding**:
   - Ingested and normalized verified mobile phone specifications from the GSMArena dataset (`arwinneil/gsmarena-phone-dataset`) and 2020–2025 Mobiles Dataset (`abdulmalik1518/mobiles-dataset-2025`).
   - Generated database migration `supabase/migrations/20261015170000_seed_phone_reference_weights.sql` and `supabase/seed.sql` populating `public.device_model` with 7,767 unique verified smartphone models with baseline weights (`baseline_weight_g`), physical thickness (`baseline_thickness_mm`), and `ON CONFLICT (brand, model_name, device_type)` upserts.
   - Updated the Reference Weights screen (`dashboard/app/diagnostics/reference-weights/page.tsx` & `table-client.tsx`) to display 52 curated authentic smartphones (Apple iPhone 16/15/14/13/12/11/SE, Samsung Galaxy S24/S23/S22/A54/A34/Z Flip, Google Pixel 9/8/7/6, OnePlus 12/11, Xiaomi 14, Motorola Edge, Sony Xperia) with exact nominal weights and calculated tolerance ranges (accepted ±5%, recycle <85%).
   - Restored and polished the layout styling for `/settings` and `/diagnostics/reference-weights` matching ReGrade visual tokens and top navigation.
   - Verified complete production build (`npm run build`) with zero TypeScript errors.

