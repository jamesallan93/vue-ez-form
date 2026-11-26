# Default values

There are three places a field's starting value can come from, resolved in this order,
highest priority first:

1. **`initialValues`**: the `<Form :initial-values="...">` prop, a runtime value (e.g.
   prefilling an edit form from a record you just fetched).
2. **`schema.defaultValues`**: a top-level map on the `FormSchema` itself, shaped like
   `initialValues` (nested objects/arrays, not a flat dotted-path record).
3. **`field.defaultValue`**: a single `InputFieldEntry`'s own default.
4. `undefined`, if none of the above apply, same as before this existed.

```ts
const schema: FormSchema = {
  defaultValues: {
    category: 'general', // seeds 'category' when no initialValues entry exists for it
  },
  fields: {
    country: {
      type: 'text',
      name: 'country',
      defaultValue: 'USA', // this field's own default; nothing else seeds it
    },
    category: {
      type: 'select',
      name: 'category',
      fieldProps: { options: [/* ... */] },
    },
  },
}
```

```vue
<!-- initialValues still wins over both schema.defaultValues and field.defaultValue -->
<Form :schema="schema" :initial-values="{ category: 'support' }" />
```

## Why this exists

Without a schema- or field-level default, a text field with no `initialValues` entry
starts as `undefined`. That's a real gotcha with Standard Schema validators: `z.string()`
(and yup's `.required()`) reject `undefined` with their own generic base-type error
("expected string, received undefined") *before* a custom message like
`z.string().min(1, 'Name is required')` ever gets a chance to run. Seeding the field as
`''` via `defaultValue` (or `schema.defaultValues`) avoids that entirely. The field is
always at least a string, so your intended validation message is the one that shows.

## `resetForm()` follows the same chain

Calling `formRef.resetForm()` with no argument resets every field through this exact same
precedence. A field with only a schema-level default still resets to it correctly, not
to `undefined`.

## Dirty tracking uses the resolved value, not raw `initialValues`

`FieldState.dirty` is computed against whichever value actually seeded the field,
including a schema- or field-level default, not just the raw `initialValues` slice. A
field that was seeded from `defaultValue: 'USA'` and never touched is **not** dirty; one
that a user changed back to exactly that default is also not dirty.
