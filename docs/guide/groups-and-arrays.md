# Groups & arrays

## Groups nest values, they don't flatten

A `GroupFieldEntry` always contributes its own key as a path segment. A group named
`address` containing a `city` field produces `values.address.city`. There is no special
case where an ordinary group's children end up flat at the top level.

## Cross-field validation, including nested groups

A group's own `validate` runs against its reconstructed values, including a nested
group or array child's *real* value, not `undefined`:

```ts
{
  fields: {
    sameAsBilling: { type: 'text', name: 'sameAsBilling' },
    address: {
      fields: { street: { type: 'text', name: 'street' } },
    },
  },
  validate: (value) => {
    const v = value as { sameAsBilling?: string; address?: { street?: string } }
    if (v.sameAsBilling === 'no' && !v.address?.street) {
      return 'Street is required when not same as billing'
    }
    return true
  },
}
```

An issue with a `path` routes to the child named by `path[0]`; a pathless issue becomes a
group-level error (`state.groupErrors[name]`).

The plain function above is the escape hatch; most of the time you'd reach for your
validation library's own cross-field support instead, exactly the way you already would
outside EzForm. A `GroupFieldEntry.validate` is just a Standard Schema or plain function
like any other field's, so a schema object works here too:

```ts
import { object, string } from 'yup'

{
  fields: {
    sameAsBilling: { type: 'text', name: 'sameAsBilling' },
    address: {
      fields: { street: { type: 'text', name: 'street' } },
    },
  },
  validate: object({
    sameAsBilling: string(),
    address: object({ street: string() }),
  }).test(
    'street-required',
    'Street is required when not same as billing',
    (value) => !(value?.sameAsBilling === 'no' && !value?.address?.street),
  ),
}
```

```ts
import { z } from 'zod'

{
  // ...same fields...
  validate: z
    .object({
      sameAsBilling: z.string().optional(),
      address: z.object({ street: z.string().optional() }).optional(),
    })
    .refine((v) => !(v.sameAsBilling === 'no' && !v.address?.street), {
      message: 'Street is required when not same as billing',
    }),
}
```

Both run through `~standard.validate` exactly like any other field's validator; EzForm
never special-cases a group's schema versus a plain input's.

## Arrays

`ArrayFieldEntry.items` is any `FieldEntry`: a group for object-shaped items, a plain
input for scalars, or another array for nesting:

```ts
{
  type: 'array',
  minItems: 1,
  maxItems: 5,
  items: { type: 'text', name: 'tag' }, // scalar items
}
```

```ts
{
  type: 'array',
  items: {
    type: 'array',                      // array of arrays, any depth
    items: { type: 'text', name: 'cell' },
  },
}
```

### Array operations

`Form.vue` exposes the engine's array operations for each array field through the same
per-field named slot used for overrides, with default Add/Remove buttons as fallback
content if you don't fill the slot:

```vue
<template #specialties="{ field, length, add, remove, insert, prepend, swap, move, update, replace }">
  <div v-for="i in length" :key="i">
    <!-- render field.items at 'specialties.{i-1}.*' -->
    <button @click="remove(i - 1)">Remove</button>
  </div>
  <button @click="add()">Add specialty</button>
</template>
```

| Operation | Signature | Behavior |
|---|---|---|
| `add` | `(value?) => void` | Appends an item at the end, optionally seeded with `value` |
| `remove` | `(index) => void` | Removes the item at `index`, shifting later items down |
| `insert` | `(index, value?) => void` | Inserts a new item at `index`, shifting items at/after it up |
| `prepend` | `(value?) => void` | Sugar for `insert(0, value)` |
| `swap` | `(indexA, indexB) => void` | Swaps two items' entire state (value, errors, touched, dirty) |
| `move` | `(fromIndex, toIndex) => void` | Moves an item to a new index, shifting the items in between |
| `update` | `(index, value) => void` | Replaces the value at `index` without reordering anything |
| `replace` | `(items) => void` | Replaces the whole array's items, resizing as needed |

`value` (and each entry of `items` for `replace`) is always the whole item's value, shaped
exactly like it would appear in `values`/`initialValues`, never a single sub-field in
isolation:

- Scalar `items` (a plain input, e.g. `{ type: 'text', name: 'tag' }`): a plain value, e.g.
  `'vue'`.
- Object-shaped `items` (a group, e.g. `{ fields: { title, duration } }`): a whole object,
  e.g. `{ title: 'Vue', duration: '3' }`. Calling `update(1, { title: 'Vue', duration: '3' })`
  writes into that item's `title` and `duration` fields in one call.
- Nested-array `items`: an array of that nested item's own values, e.g. `['a', 'b']` for
  one row of a matrix.

An out-of-range index is always a no-op, never an error, for every one of these. The ones
that change the array's length (`add`, `insert`, `prepend`, `remove`, `replace`) also
respect `minItems`/`maxItems`; `swap`, `move`, and `update` never change the length, so
those two don't apply to them.

`minItems`/`maxItems` are enforced by the engine itself. `add()` past `maxItems` or
`remove()` below `minItems` is a no-op, not an error.

### Validation at the right level

- Each item's own `validate` (inherited from `items`) runs per index, independently.
- The array's own `validate` runs against the whole current array value, separately,
  for rules like "at least one item required" that don't belong to any single item.
- In a nested array, a row's own `validate` failing surfaces under that row's own path
  (`matrix.0`), while the outer array's `validate` (e.g. checking only the outer length)
  stays unaffected.

### Reindexing

Removing item `0` from a 3-item array correctly shifts every remaining item's state down
by one (`specialties.1.*` → `specialties.0.*`), including any nested array state inside
those items, with no stale or duplicated keys left behind.
