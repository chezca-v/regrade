# ReGrade: outstanding work

This tracks what still needs to be done before ReGrade produces a real,
trustworthy grade end to end, as of 2026-10-21. It complements
[ARCHITECTURE.md](ARCHITECTURE.md) and [ERD.md](ERD.md), which describe what
exists; this file describes what does not yet, and who needs to decide what.
Keep it current as items close — do not let it drift the way the old
"Implementation History" claims in [AGENTS.md](AGENTS.md) did.

## What is already done

Firmware → MQTT → `cloud/mqtt-listener.py` → `station_telemetry` → dashboard
reporting code is implemented, but do not claim current hardware is validated:
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
  the signed-in operator's own saved disposition.** They intentionally omit
  unstable sensor readings and do not calculate an automated classification.
  Apply the operator phone reference migration and sign in to save reviews.
- **The diagnostic page does not remotely trigger the station.** It selects a
  reference and waits for a report after the operator presses the physical
  START button. MQTT reports are polled from Supabase; no browser-to-ESP32
  command channel exists.

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
