# ReGrade: outstanding work

This tracks what still needs to be done before ReGrade produces a real,
trustworthy grade end to end, as of 2026-10-20. It complements
[ARCHITECTURE.md](ARCHITECTURE.md) and [ERD.md](ERD.md), which describe what
exists; this file describes what does not yet, and who needs to decide what.
Keep it current as items close — do not let it drift the way the old
"Implementation History" claims in [AGENTS.md](AGENTS.md) did.

## What is already done

So this isn't read as "nothing works": firmware → MQTT → `cloud/mqtt-listener.py`
→ `station_telemetry` → the `/diagnostics` live table is complete and
exercised end to end, including `grade`, `health_score`, and `sort_success`.
`HX711_COUNTS_PER_GRAM` and `TOF_EMPTY_BED_DISTANCE_MM` are calibrated for the
reference station. `device_model` is seeded with ~7,700 real phone specs and
read by the Reference Weights screen. `/inventory/[id]` reads real telemetry
by `session_id`, and `/diagnostics` links to it.

## Firmware (`firmware/`)

- **Grading thresholds are unapproved.** `config::GRADING_RULES_APPROVED` is
  `false` and the six threshold constants in
  `firmware/include/regrade_config.h` are placeholder zeros. Every real
  session currently ends at `status: calibration_required`. Needs: a
  specific reference device (or documented test population), real measured
  threshold values, and a deliberate sign-off before flipping the flag. See
  the "Decisions needed" section below for a starting point on the numbers.
- **No per-device-model thresholds.** `loadThresholds()` returns one global
  rule set; there is no way for the firmware to know which phone model is on
  the scale, so thresholds can't scale with a model's baseline weight the way
  `device_model.baseline_weight_g` could support. Needs a device
  identification input (manual selection via the LCD/button, a barcode/IMEI
  scan, etc.) before this is worth building.
- **Sorter actuation is a non-actuating stub.** `actuateDiverter()` in
  `firmware/src/main.cpp` always returns `false` by design. Needs: a reviewed
  mechanism (travel limits, interlocks), an independent servo power supply
  (never an ESP32 GPIO), and a safety review before it does anything.
- **The electrical test fixture is not yet reviewed.** `readElectricalCurrent()`
  reads whatever the INA219 is wired to; the "current-limited 5 V test
  fixture" it depends on is still a planned/unreviewed circuit per
  `circuit/`. `GRADING_OVERCURRENT_MA` must match this fixture's real current
  limit once it exists — don't set one without the other.
- **Grade B is undefined.** `gradeDevice()` only emits A, C, or D; there's a
  `TODO` at `firmware/src/main.cpp` marking borderline criteria as
  uncalibrated. Decide if a Grade B tier is needed for this capstone's scope.
- **Telemetry delivery is best-effort.** No durable buffering or confirmed
  delivery if the broker is briefly unreachable during `publishReport()`; a
  report is simply dropped with a serial log line. Acceptable for a
  prototype; call it out if this ships beyond that.

## Cloud listener (`cloud/`)

- Functionally complete for the fields firmware sends (see "What is already
  done"). Nothing left in the code itself.
- Operationally, it only runs as a foreground script (`python
  cloud/mqtt-listener.py`) per `docs/SETUP_GUIDE.md`. There's no supervised
  deployment (systemd unit, Docker service, process manager with restart
  policy) documented, so it silently stops persisting telemetry if the
  process dies. Fine for local development; needs a decision before any
  longer-running demo or deployment.

## Database / Supabase (`supabase/`)

- **No link between telemetry and device identity.** `station_telemetry` has
  no foreign key to `device_model`, because firmware doesn't report one (see
  the firmware item above). Until it does, the dashboard can't show which
  phone model a session was.
- **No durable record of operator decisions.** The old `sort_action`/`alert`
  tables were dropped in `20261020020000` because nothing wrote to them. If
  you want "Verify and route" / "Override" actions on the Sorting or
  Inventory screens to actually persist, that needs a new table, RLS policy,
  and Server Actions — which also means deciding who is authorized to
  override a result and whether an audit trail is required. Not yet designed.
- **Access control is single-tenant.** Per `ERD.md`, all authenticated
  accounts share one operator workspace with no per-role granularity, and
  there's no data-retention policy for `station_telemetry`. Flagged as
  pending review, not yet addressed.

## Dashboard (`dashboard/`)

- **Overview, Inventory (list), Sorting, Safety Alerts, Reports, and
  Settings are still local mock state**, not wired to Supabase. This isn't
  an oversight to "just fix" — they're built around data that doesn't exist
  yet (ESR readings, bin fill levels, A–D classification at scale) and
  wiring them up now would mostly show empty states, since no session has
  ever reached `status: graded`. Revisit once grading thresholds are
  approved and there's real graded traffic to show.
- **Device Detail (`/inventory/[id]`) is live but thin.** It only shows what
  `station_telemetry` actually stores: status, grade, health score, fault,
  and the four raw readings. There's no device model name, no per-check
  threshold breakdown (which flag caused a grade — that level of detail
  isn't persisted), and no multi-step activity timeline (only the one
  report event). This is an honest reflection of current data, not a bug,
  but it will look sparse until the gaps above close.
- **No way to browse real sessions except via the Diagnostics table's "View"
  link.** There's no real-data equivalent of the Inventory list, so a real
  session is only reachable if you know (or click through from) its
  `session_id`.

## Hardware / physical

- Reviewed, current-limited 5 V test fixture: not yet built/validated.
- Sorter mechanism, travel limits, and interlocks: not yet validated.
- Separate servo power supply: not yet specified.
- HX711 and VL53L0X calibration constants are per-station and must be
  re-measured (see `docs/SETUP_GUIDE.md`) whenever a sensor is remounted or a
  new station is assembled — this is an ongoing operational step, not a
  one-time fix.

## Decisions needed from the team (not code changes)

1. **Reference device and the six grading threshold values.** Starting
   points already implied by the project's own UI (`dashboard/lib/rg-data.ts`,
   `dashboard/app/settings/page.tsx`): swelling hazard 3.5 mm, zero-current
   50 mA, temperature rise 15 °C. `GRADING_MINIMUM_WEIGHT_G` and
   `GRADING_BASELINE_THICKNESS_MM` need an actual reference device's spec or
   measured values; `GRADING_OVERCURRENT_MA` needs the real test fixture's
   current limit once it's built.
2. **Whether operator triage decisions need to persist**, and if so, the
   authorization/audit model for who can verify or override a grade.
3. **Whether per-device-model grading is in scope for this capstone**, and if
   so, how a station would identify which model is under test.
4. **How the MQTT listener is deployed** beyond local development (process
   manager, container, always-on host).
