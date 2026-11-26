## 1. Engine
- [x] 1.1 `addArrayItem(path, value?)`: thread an optional seed value through to `instantiateArrayItem`
- [x] 1.2 Add a `setValueAtPath(path, value)` helper: writes `value` into every registered field under `path` (object-shaped item) or directly onto a single field at `path` (scalar item), reused by `updateArrayItem` and `replaceArray`
- [x] 1.3 `insertArrayItem(path, index, value?)`: shift items at/after `index` up by one (moveSubtree in descending order to avoid clobbering), instantiate the new item at `index`, respect `maxItems`
- [x] 1.4 `prependArrayItem(path, value?)`: `insertArrayItem(path, 0, value)`
- [x] 1.5 `swapArrayItems(path, indexA, indexB)`: swap two items' full subtrees via a temporary path
- [x] 1.6 `moveArrayItem(path, fromIndex, toIndex)`: shift the intervening items and place the moved item's subtree at `toIndex`
- [x] 1.7 `updateArrayItem(path, index, value)`: `setValueAtPath` at that item's path, no reordering
- [x] 1.8 `replaceArray(path, items)`: resize (reusing resetForm's array-resize logic) then `updateArrayItem` each index

## 2. Types and renderer
- [x] 2.1 Add the six new method signatures to `FormEngine` in `src/types/form-engine.ts`
- [x] 2.2 Expose them through `Form.vue`'s per-array named slot alongside `add`/`remove`

## 3. Verification
- [x] 3.1 Exercised insert, prepend, swap, move, update, and replace directly against the running root playground's engine instance (via the browser's dynamic import of useFormEngine.ts), for both scalar items (a `tags`-style array) and object-shaped items (a `specialties`-style group array); all produced correct values and correct lengths
- [x] 3.2 Type-checked (root project + the shadcn-vue example). Confirmed swap/move correctly carry each item's own state (value) along with it, not just reshuffling values in place, by verifying via moveSubtree reuse (the same mechanism `removeArrayItem`'s reindexing already relied on and was previously verified for)
