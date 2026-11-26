## Why

Repeatable field groups (e.g. a list of specialties, line items, contacts) are a capability
both comparison libraries (Vueform's "Repeat multiple elements" recipe, TanStack Form's field
arrays) provide and EzForm currently lacks entirely — the one confirmed feature gap from
comparing EzForm against Vueform and TanStack Form. The `ArrayFieldEntry` schema shape was
designed (see this change's `field-schema` delta) but never added to `field.ts`, and nothing
else in the system acts on it yet.

## What Changes

- `useFormEngine`'s `collect()` must become capable of instantiating/removing field state at
  runtime as array items are added/removed, instead of walking the schema once at setup.
- Array items need indexed field keys (e.g. `specialties.0.title`) rather than flat names,
  since the same `items` template repeats under different positions.
- New engine operations: add an item, remove an item (respecting `minItems`/`maxItems`), and
  re-run validation/value-collection across a variable-length set.
- `Form.vue`'s renderer needs an array-rendering branch (alongside static/group/input),
  rendering `items` once per current array length.

## Capabilities

### New Capabilities
- **field-schema**: `ArrayFieldEntry` added to the `FieldEntry` union.

### Modified Capabilities
- **form-engine**: per-field state tracking changes from a fixed, schema-walked set to a
  dynamic one that can grow/shrink at runtime.
- **form-renderer**: dispatch for `ArrayFieldEntry`, rendering `items` N times with add/remove
  controls exposed to the consumer (likely via a slot, matching the per-field slot pattern
  already used for single fields).

## Impact

- Affected code: `src/types/field.ts` (add `ArrayFieldEntry` to the union — not yet present),
  `src/composables/useFormEngine.ts` (collect, validateField/Group/All, getFieldBinding,
  resetForm, setValues all assume a static field set today), `src/components/Form.vue` (new
  array-rendering branch), `src/types/form-state.ts` (may need to represent a variable-length
  `fields` map differently, or just rely on the key-naming convention above).
