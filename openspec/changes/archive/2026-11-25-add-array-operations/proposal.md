## Why

`FormEngine` currently exposes exactly two array operations: `addArrayItem` (append only,
no seed value) and `removeArrayItem`. Compared against vee-validate v5's `FieldArray` API
(`push`, `prepend`, `remove`, `swap`, `insert`, `update`, `replace`, `move`), EzForm is
missing insert-at-index, prepend, swap, move, update-in-place, and whole-array replace.
These are common real-world needs (reordering a list via drag handles, inserting a row at
a specific position, bulk-replacing an array from an API response) that currently have no
supported path other than manually calling `remove`/`add` in a loop and losing item
identity/order along the way.

## What Changes

- `addArrayItem(path, value?)`: now accepts an optional seed value for the new item
  (parity with `push(item)`), instead of always seeding `undefined`.
- `insertArrayItem(path, index, value?)`: inserts a new item at `index`, shifting every
  item at or after `index` up by one. `index` must be in `[0, length]`; out of range is a
  no-op (matching `insert`'s "out-of-bounds is ignored, appending at length is allowed").
  Respects `maxItems`.
- `prependArrayItem(path, value?)`: sugar for `insertArrayItem(path, 0, value)`.
- `removeArrayItem(path, index)`: unchanged.
- `swapArrayItems(path, indexA, indexB)`: swaps two items' entire state (value, errors,
  touched, dirty, including nested descendants). No-op if either index is out of range.
- `moveArrayItem(path, fromIndex, toIndex)`: moves the item at `fromIndex` to `toIndex`,
  shifting the items in between. No-op if either index is out of range.
- `updateArrayItem(path, index, value)`: replaces the value at `index` without reordering
  anything. For an object-shaped item (a group), writes `value`'s fields into each
  descendant field under that item's path; for a scalar item, sets the single field's
  value directly. No-op if `index` is out of range.
- `replaceArray(path, items)`: replaces the whole array's current items with `items`,
  resizing (respecting `minItems`/`maxItems`) and seeding each new value via the same
  mechanism as `updateArrayItem`.
- `Form.vue`'s per-array named slot gains these new operations alongside the existing
  `add`/`remove`.

## Capabilities

### Modified Capabilities
- **form-engine**: `FormEngine` gains `insertArrayItem`, `prependArrayItem`,
  `swapArrayItems`, `moveArrayItem`, `updateArrayItem`, `replaceArray`; `addArrayItem`
  gains an optional seed-value parameter.
- **form-renderer**: the array field's named slot exposes these new operations.

## Impact

- Affected code: `src/types/form-engine.ts` (new method signatures),
  `src/composables/useFormEngine.ts` (implementations, reusing `registerEntry`/
  `deregisterUnder`/`moveSubtree`), `src/components/Form.vue` (slot props).
- No breaking change — existing `addArrayItem(path)`/`removeArrayItem(path, index)` calls
  keep working identically.
