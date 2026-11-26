# The schema shape

A `FormSchema` is `{ fields: Record<string, FieldEntry> }`, plus an optional top-level
[`defaultValues`](/guide/default-values.md). Every entry in `fields` is exactly one of four
kinds, told apart by which keys it has. There's no `kind`/`discriminant` field to set
yourself except where noted.

## `StaticFieldEntry`: visual only

```ts
{ type: 'static', tag: 'h2', content: 'Section title', class: 'text-xl' }
```

No validation, no value, no entry in `values`. Just `<component :is="tag">{{ content }}</component>`,
unless you override it with a [slot](/guide/slots.md#static-entries), which is how you'd
render something richer than a single tag (a real alert/banner component, say).

## `GroupFieldEntry`: nested fields, optionally cross-validated

```ts
{
  fields: {
    password: { type: 'password', name: 'password', validate: z.string().min(8) },
    confirm: { type: 'password', name: 'confirm', validate: z.string().min(8) },
  },
  validate: (value) => {
    const v = value as { password?: string; confirm?: string }
    return v.password === v.confirm ? true : 'Passwords must match'
  },
}
```

Told apart by having a `fields` key (no `type`). Its own `validate` runs against `{
[childName]: value }`, the group's own reconstructed values, including a nested group or
array child's real value, not just direct scalar children. A validation issue with a
`path` attaches to the named child; a pathless issue becomes a group-level error
(`state.groupErrors[groupName]`).

Values nest the same way the schema does: a group named `shipping` containing a field
named `city` produces `values.shipping.city`, not a flat `values.city`. There is no
"transparent passthrough" group.

## `InputFieldEntry`: a real input

```ts
{
  type: 'text',       // key into your componentMap
  name: 'email',       // also the key this field's value is read/written under
  label: 'Email',
  required: true,       // display-only marker; independent of `validate`
  description: 'We will never share this',
  placeholder: 'you@example.com',
  validate: z.string().email(),
  fieldProps: { autocomplete: 'email' }, // passed straight through to your component
  class: 'my-field-wrapper',
  columns: 6,           // see Layout
  defaultValue: '',     // see Default values
}
```

`type` is never interpreted by EzForm itself. It's purely a lookup key into whatever
`componentMap` you registered (see [Bring your own components](/guide/components.md)).

## `ArrayFieldEntry`: a repeatable list

```ts
{
  type: 'array',
  minItems: 1,
  maxItems: 5,
  items: {
    fields: {
      title: { type: 'text', name: 'title' },
      years: { type: 'number', name: 'years' },
    },
  },
  validate: (value) => (Array.isArray(value) && value.length > 0 ? true : 'Add at least one'),
}
```

`items` is itself any `FieldEntry`: a group (object-shaped items), a plain input (scalar
items like a list of tags), or another `ArrayFieldEntry` (arrays of arrays, to any depth).
Items are identified by position (`specialties.0.title`, `specialties.1.title`, ...), not
by name. An `items` entry's own `name` is ignored.

`validate` here runs against the array's *whole* current value, separately from each
item's own per-item validation (inherited from `items`'s own `validate`). See
[Groups & arrays](/guide/groups-and-arrays.md) for add/remove, nesting, and reindexing
behavior.

## Column distribution

Every `InputFieldEntry`/`GroupFieldEntry` can set `columns`: a number out of 12, or
`{ container, label, wrapper }` for finer control. A group with no explicit `columns` on
its children distributes 12 evenly among them (2 children get 6 each, 3 children get 4
each). EzForm only computes the *number*. Turning it into an actual CSS class or style is
your component's job. See [Layout](/guide/layout.md).
