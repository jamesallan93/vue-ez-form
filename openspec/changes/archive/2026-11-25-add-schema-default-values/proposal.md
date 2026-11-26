## Why

Today the only way to seed a field's starting value is the `initialValues` prop passed to
`<Form>` at the call site (`FormEngineOptions.initialValues`) — nothing in the schema itself
carries a default. This bit us directly: `basicSchema`'s `name`/`email` fields (and the grid
form's `dob`) had no `initialValues` wired up anywhere, so they started as `undefined`, and a
zod/yup schema's own base-type check (`expected string, received undefined`) fired before the
field's intended custom message ever had a chance to (see the shadcn-vue example's basic-form
bug fix). A schema-level or field-level default would let a field declare its own sane
starting value right where its `type`/`validate` already live, instead of requiring every
consumer to separately remember to wire up `initialValues` for every text field.

## What Changes

- Add an optional `defaultValue` to `InputFieldEntry` (`src/types/field.ts`) — a single
  field's own default, e.g. `{ type: 'text', name: 'email', defaultValue: '' }`.
- Add an optional top-level `defaultValues?: Record<string, unknown>` to `FormSchema` —
  same dotted-path-free, nested shape as `initialValues` — for seeding many fields in one
  place without repeating `defaultValue` on each.
- Precedence when seeding a field's starting value, highest first:
  1. `FormEngineOptions.initialValues` (the `<Form initial-values>` prop — an explicit,
     runtime override, e.g. prefilling an edit form from a fetched record)
  2. `FormSchema.defaultValues` (schema-level)
  3. `InputFieldEntry.defaultValue` (field-level)
  4. `undefined`, same as today, if none of the above apply
- `resetForm()` (with no argument) falls back to this same precedence chain, not just
  `initialValues`, so a field with only a schema-level default still resets to it correctly.

## Capabilities

### Modified Capabilities
- **field-schema**: `InputFieldEntry` gains `defaultValue`; `FormSchema` gains
  `defaultValues`.
- **form-engine**: seeding at setup and in `resetForm()` resolves a field's starting value
  through the precedence chain above, instead of only `initialValues`.

## Impact

- Affected code: `src/types/field.ts` (new `defaultValue` on `InputFieldEntry`; new
  `defaultValues` on `FormSchema`, both declared in this same file), and
  `src/composables/useFormEngine.ts` (`registerEntry`'s seeding call and `resetForm`'s
  `source` resolution).
- No breaking change — a schema with no defaults anywhere behaves exactly as today.
