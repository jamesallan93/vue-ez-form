## Why

`FieldBinding` only ever carries one field's own value. A consumer asked whether a
rendered component (not just a custom-slot author) can read the whole form's current
values via props, matching vee-validate's `useFormValues()`. There was no way to do this:
a component dispatched via `componentMap` only ever sees its own `modelValue`.

## What Changes

- `Form.vue` now `provide`s the whole form's reconstructed `values` under a new
  `EZFORM_VALUES` injection key (exported from `src/plugin.ts`), so any descendant
  component (dispatched via `componentMap`, or rendered inside a custom per-field slot at
  any depth) can read it with `inject(EZFORM_VALUES)`.
- Every per-field slot's scope object (input, static, array) also carries `values`
  directly, alongside the existing `field`/`binding`, for a plain destructure instead of
  an `inject` call.
- Deliberately NOT passed as a direct prop to every `componentMap`-dispatched component:
  verified that a component which doesn't declare an unused prop it's handed receives it
  as a stray DOM attribute (Vue's default `inheritAttrs` fallthrough) instead, which would
  have affected every existing input component the moment this landed.

## Capabilities

### Modified Capabilities
- **form-renderer**: adds the whole-form-values-via-inject/slot-scope capability.

## Impact

- Affected code: `src/plugin.ts` (new `EZFORM_VALUES` key), `src/components/Form.vue`
  (`provide`, plus `values` added to each slot's scope object).
- No breaking change. No existing prop or slot prop is removed or renamed.
