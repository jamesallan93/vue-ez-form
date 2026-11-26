## Why

vee-validate's `<Field>` (https://vee-validate.logaretm.com/v5/api/field/) exposes two
different binding shapes through its slot: `field` (`value`/`name`/`onBlur`/`onInput`/
`onChange`), meant to be `v-bind`'d directly onto a raw native `<input>`, and
`componentField` (`modelValue`/`onUpdate:modelValue`), meant for a Vue component using
`v-model`. EzForm's `FieldBinding` only covers the second case. Spreading it onto a native
element doesn't work: `v-bind="{ modelValue, 'onUpdate:modelValue': fn }"` on a plain
`<input>` just sets a nonstandard `modelvalue` attribute and listens for a DOM event
literally named `update:modelValue`, which native elements never dispatch — Vue's
`v-model` directive on native elements is compiler sugar (`:value` + `@input`), not a
generically spreadable object.

## What Changes

- Add `NativeFieldBinding<T>` (`src/types/field-state.ts`): `{ value: T, name: string,
  onInput: (event: Event) => void, onBlur: () => void }`, meant to be `v-bind`'d directly
  onto a native `<input>`/`<textarea>`/`<select>`.
- `FormEngine` gains `getNativeFieldBinding(name)`, deriving this from the same
  `FieldState` `getFieldBinding` already reads, writing `(event.target as
  HTMLInputElement).value` back as the field's new value on `input` (same dirty/validate
  side effects as `getFieldBinding`'s `onUpdate:modelValue`).
- `Form.vue`'s per-field named slot gains a `native` scope prop (alongside the existing
  `binding`) for this.
- Scope: text-like native inputs only (reads/writes `.value` as a string). Checkboxes,
  radios, numeric `valueAsNumber`, and anything needing real typed casting are explicitly
  out of scope here — same as vee-validate's own `field`, which needs its `type` prop to
  special-case those. A field needing that still uses the existing component-oriented
  `binding`/`componentMap` path.

## Capabilities

### Modified Capabilities
- **form-engine**: `FormEngine` gains `getNativeFieldBinding`.
- **form-renderer**: the per-field slot scope gains `native`.

## Impact

- Affected code: `src/types/field-state.ts` (new type), `src/types/form-engine.ts` (new
  method), `src/composables/useFormEngine.ts` (implementation), `src/components/Form.vue`
  (slot scope).
- No breaking change — purely additive.
