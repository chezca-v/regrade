# ReGrade: outstanding work

This tracks what still needs to be done before ReGrade produces a real,
trustworthy grade end to end, as of 2026-10-21. It complements
[ARCHITECTURE.md](ARCHITECTURE.md) and [ERD.md](ERD.md), which describe what
exists; this file describes what does not yet, and who needs to decide what.
Keep it current as items close — do not let it drift the way the old
"Implementation History" claims in [AGENTS.md](AGENTS.md) did.

## What is already done

Firmware → MQTT → `cloud/mqtt-listener.py` → `station_telemetry` → dashboard
reporting code is implemented, including one-second live sensor updates during
a scan and a hideable feed in the diagnostics scan window. Do not claim current
hardware is validated:
the current station has logged LCD and VL53L0X I²C initialization failures.
Firmware now checks three consecutive samples against five per-sensor
stability tolerances and times out within 15 seconds. Those tolerances
intentionally default to zero, so the firmware cannot report stable readings
until the assembled station has been repaired, calibrated, and reviewed.
Phone references and operator dispositions can be connected to a report, and
Overview, Inventory, Device Detail, and Reports now derive their data from
telemetry and the signed-in operator's saved review.

## Firmware (`firmware/`)

- **Grading thresholds are unapproved.** `config::GRADING_RULES_APPROVED` is
  `false`. Current-based grading (zero-current / overcurrent) was dropped
  entirely rather than approved: there is no reviewed, current-limited load
  fixture to apply a real charge stimulus, so an INA219 reading during a scan
  does not reflect real device behavior either way (see the next bullet).
  `GRADING_SWELLING_MM` (3.5 mm) and `GRADING_TEMPERATURE_RISE_C` (15 °C) are
  set from the dashboard's own pre-existing placeholder numbers
  (`lib/rg-data.ts`), adopted as a deliberate decision rather than left as
  zero. `GRADING_MINIMUM_WEIGHT_G` and `GRADING_BASELINE_THICKNESS_MM` still
  need one specific reference device's measured weight/thickness — the
  firmware has no per-model identification input, so this is a single global
  pair of values, not per-model. Every real session ends at
  `status: calibration_required` until those two are set and the flag flips.
- **No per-device-model thresholds.** `loadThresholds()` returns one global
  rule set; there is no way for the firmware to know which phone model is on
  the scale, so thresholds can't scale with a model's baseline weight the way
  `device_model.baseline_weight_g` could support. Needs a device
  identification input (manual selection via the LCD/button, a barcode/IMEI
  scan, etc.) before this is worth building.
- **Sensor stability tolerance values are uncalibrated.** The
  `*_STABILITY_TOLERANCE_*` constants are zero. Stability detection is
  implemented fail-closed, but reports will not be stable until each value is
  measured and approved on the assembled station. The recent I²C failures
  must be fixed before measuring repeatability.
- **Sorter actuation is a non-actuating stub.** `actuateDiverter()` in
  `firmware/src/main.cpp` always returns `false` by design. Needs: a reviewed
  mechanism (travel limits, interlocks), an independent servo power supply
  (never an ESP32 GPIO), and a safety review before it does anything.
- **The electrical test fixture is not yet reviewed.** `readElectricalCurrent()`
  reads whatever the INA219 is wired to; the "current-limited 5 V test
  fixture" it depends on is still a planned/unreviewed circuit per
  `circuit/`. `current_ma` is still measured and reported in telemetry for
  visibility, but it does not gate a grade (see above) until that fixture
  exists and a real current threshold can be reviewed against it.
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

- **Phone identity is an operator association.** `operator_diagnosis` links a
  selected `device_model` reference to a telemetry row for the signed-in
  operator; the firmware does not identify the phone. Ensure migration
  `20261021080000` is applied to enable this workflow.
- The old `sort_action`/`alert` tables were dropped in `20261020020000`.
  Sorting-screen "Verify and route" / "Override" actions still do not persist;
  authorization and a separate audit trail need to be designed before wiring
  physical sorting.
- **Access control is single-tenant.** Per `ERD.md`, all authenticated
  accounts share one operator workspace with no per-role granularity, and
  there's no data-retention policy for `station_telemetry`. Flagged as
  pending review, not yet addressed.

## Dashboard (`dashboard/`)

- **Sorting, Safety Alerts, and Settings remain mock state.** Sorting is not
  wired to the hardware or persisted. Safety Alerts and Settings have no
  corresponding live workflow.
- **Overview, Inventory, Device Detail, and Reports show actual telemetry and
  the current visitor's own saved disposition.** They intentionally omit
  unstable sensor readings and do not calculate an automated classification.
  There is no sign-in screen: every visitor gets a silent anonymous Supabase
  Auth session (`lib/supabase/ensure-user.ts`), which still gives each saved
  review a stable identity for "my own reviews" queries and RLS — apply the
  operator phone reference migration and enable anonymous sign-ins on the
  Supabase project for this to work.
- **The diagnostic page can remotely wake the station, best-effort.** "Continue
  to station" queues a `station_command` row
  (see migration `20261022090000`); `cloud/mqtt-listener.py` polls for pending
  rows and relays them to the station's MQTT command topic, which the firmware
  treats like a physical START press. There is no delivery guarantee (it
  depends on the listener and broker being up), the browser never talks to
  the ESP32 directly, and anonymous users still need the physical START
button. The dashboard polls Supabase about once per second for live sensor
updates; it does not use a push subscription.

## Hardware / physical

- Reviewed, current-limited 5 V test fixture: not yet built/validated.
- Sorter mechanism, travel limits, and interlocks: not yet validated.
- Separate servo power supply: not yet specified.
- HX711 and VL53L0X calibration constants are per-station and must be
  re-measured (see `docs/SETUP_GUIDE.md`) whenever a sensor is remounted or a
  new station is assembled — this is an ongoing operational step, not a
  one-time fix.

## Decisions needed from the team (not code changes)

1. **Reference device for the remaining two grading threshold values.**
   Swelling (3.5 mm) and temperature rise (15 °C) are adopted from the
   project's own UI placeholders (`dashboard/lib/rg-data.ts`,
   `dashboard/app/settings/page.tsx`). `GRADING_MINIMUM_WEIGHT_G` and
   `GRADING_BASELINE_THICKNESS_MM` still need one specific reference device's
   spec or measured weight/thickness before `GRADING_RULES_APPROVED` can flip
   to `true`.
2. **Whether operator triage decisions need to persist**, and if so, the
   authorization/audit model for who can verify or override a grade.
3. **Whether per-device-model grading is in scope for this capstone**, and if
   so, how a station would identify which model is under test.
4. **How the MQTT listener is deployed** beyond local development (process
   manager, container, always-on host).
