## 1. Schema and engine: dynamic field-state management
- [x] 1.0 Add `ArrayFieldEntry` to `src/types/field.ts` and the `FieldEntry` union
- [x] 1.1 Design the indexed-key convention for array items (full dotted path from schema root, e.g. `specialties.0.title`; unified so ordinary groups use the same convention, not just arrays)
- [x] 1.2 Change `collect()` (now `registerEntry`) to register/unregister field state for one array index on demand, not just at initial setup
- [x] 1.3 Add `addArrayItem(name)` / `removeArrayItem(name, index)`, respecting `minItems`/`maxItems`
- [x] 1.4 Update `validateAll()` to iterate a variable-length set of indexed keys
- [x] 1.5 Update `resetForm`/`setValues` to handle array-shaped values — `resetForm` resizes arrays back to the target's length (growing/shrinking via add/removeArrayItem) before resetting field values; `setValues` was already generic enough via `getAtPath`

## 2. Renderer: array dispatch
- [x] 2.1 Add an array-rendering branch to `Form.vue`'s recursive renderer, alongside static/group/input
- [x] 2.2 Render `items` once per current array length, passing the index-qualified key down
- [x] 2.3 Expose add/remove to the consumer — via the same per-field named slot convention (`{ field, length, add, remove }`), with default Add/Remove buttons as fallback content

## 3. Validation
- [x] 3.1 Confirm per-item validation (from `items`'s own `validate`) runs per index independently
- [x] 3.2 Confirm whole-array `validate` (e.g. "at least one item required") runs against the full array value and surfaces as an array-level error, analogous to `groupErrors`

## 4. Verification
- [x] 4.1 Playground example exercising an array of object items (`specialties`) and an array of scalars (`tags`)
- [x] 4.2 Type-check (`npm run type-check`, the real `vue-tsc --build`, not bare `--noEmit`) and manual browser verification via Docker — add/remove/reindex, per-item errors, whole-array errors, and submit producing correctly nested output all confirmed working
