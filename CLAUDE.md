# ReGrade Agent Guidelines

Project-wide guidance for AI coding agents working in this repository.

## Project scope

ReGrade is a capstone prototype for non-destructive triage of smartphones and
5 V USB chargers. Keep the distinction clear between implemented software and
planned or unvalidated hardware capabilities. The firmware currently has
sensor-acquisition, grading-rule, and servo-actuation stubs; do not describe
these as production-ready or enable them without validated hardware and
calibration.

## Repository map

- `firmware/`: ESP32 DevKit V1 firmware built with PlatformIO and Arduino.
- `cloud/`: Python MQTT listener; currently validates and logs JSON only.
- `dashboard/`: Next.js App Router dashboard with Supabase Auth and
  authenticated, read-only database access.
- `supabase/migrations/`: canonical versioned PostgreSQL schema and policies.
- `docs/`: architecture, ERD, and project documentation. Follow the more
  specific instructions in `docs/AGENTS.md` when editing documentation.
- `cad/`, `circuit/`: hardware design placeholders and review material.

## Implementation guidance

- Make focused changes and follow the existing language conventions and types.
  Prefer the smallest complete solution; avoid introducing dependencies without
  need.
- Validate external inputs and surface errors. Do not hide failures behind
  silent defaults or success-shaped fallbacks.
- Keep secrets out of source control, logs, and client-side code. Do not read,
  print, or copy local environment/secret files unless explicitly necessary.
- Never expose a Supabase secret/service-role key in browser code or a
  `NEXT_PUBLIC_` variable. The dashboard uses the publishable key and Supabase
  Auth session with database RLS; preserve its read-only access model.
- `supabase/migrations/` is the canonical database schema. Update generated or
  handwritten TypeScript database types when schema changes require it. Do not
  claim MQTT data is persisted: `cloud/mqtt-listener.py` is log-only and no
  ingestion API is currently implemented.
- Keep firmware fail-closed. Missing or uncalibrated sensor values/rules must
  not produce a grade or sorter action. Do not add device charging/load
  stimulus or servo actuation before the electrical fixture, interlocks,
  mechanism, and calibration have been independently reviewed.
- Do not present external measurements as a definitive battery-cell diagnosis.
  The DUT remains closed; no manual battery disassembly is in scope.

## Build and validation

Run only the relevant checks for the change:

- Firmware: from `firmware/`, `pio run`.
- MQTT listener: from the repository root,
  `python -m compileall -q cloud` and `python -m pip install -r cloud/requirements.txt`
  when the environment does not already have its dependency.
- Dashboard: from `dashboard/`, `npm ci`, `npm run lint`, and `npm run build`.
- Supabase: review migration changes carefully. `supabase db push` targets a
  linked project and must only be run when deployment is explicitly requested.

The GitHub Actions workflow in `.github/workflows/ci.yml` runs the firmware
build, listener syntax/dependency checks, and dashboard lint/build. Report
checks that could not be run and why; do not claim unrun tests passed.

## Documentation

Keep setup instructions, architecture diagrams, and implementation status
consistent with the code. Preserve the README's existing visual structure and
placeholder sections unless the requested change requires otherwise. Prefer
updating the relevant existing docs over duplicating large sections here.
