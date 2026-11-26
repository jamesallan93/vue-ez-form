## Why

Vueform's recipe list includes "submit only dirty values" (selective submission of only
changed fields) — a common need (e.g. PATCH requests that shouldn't overwrite untouched
fields). `FieldState.dirty` already exists per field; nothing currently exposes a filtered
values object built from it.

## What Changes

- Add a `dirtyValues` getter to `FormEngine`, alongside the existing `values`, computed from
  fields where `dirty === true`.

## Capabilities

### Modified Capabilities
- **form-engine**: `FormEngine` gains `dirtyValues` as a new exposed property.

## Impact

- Affected code: `src/types/form-engine.ts` (new member), `src/composables/useFormEngine.ts`
  (new computed), `src/components/Form.vue` (expose it via `defineExpose`, same as `values`).
- Small, self-contained — no structural engine changes required, unlike `add-repeatable-fields`.
