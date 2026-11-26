## Why

`form-engine/spec.md` carries a documented "Known limitation": `validateGroup` only
aggregated values from direct children that were plain inputs — a group (or array) nested
inside another group got no meaningful value in the parent's cross-field check, since the
old implementation read straight from `state.fields[joinPath(name, childKey)]`, which is
`undefined` for a non-input child.

## What Changes

- `validateGroup` now refreshes a nested group/array child by recursing into
  `validateGroup`/`validateArray` for it (not just `validateField` for plain inputs), before
  running the group's own cross-field validator.
- The values object passed to the group's cross-field validator is now built from the real
  reconstructed values tree (`getAtPath(buildValues(false), name)`), so a nested group or
  array child carries its actual value instead of being silently absent.
- Removes the "Known limitation" note from `form-engine/spec.md`.

## Capabilities

### Modified Capabilities
- **form-engine**: `validateGroup` correctly aggregates nested group/array children's values
  for cross-field validation.

## Impact

- Affected code: `src/composables/useFormEngine.ts` (`validateGroup` only).
- No type or public API changes.
