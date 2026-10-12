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
