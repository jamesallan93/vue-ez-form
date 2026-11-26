## 1. Types
- [x] 1.1 Add `defaultValue?: unknown` to `InputFieldEntry` in `src/types/field.ts`
- [x] 1.2 Add `defaultValues?: Record<string, unknown>` to wherever `FormSchema` is defined (same shape/convention as `FormEngineOptions.initialValues`)

## 2. Engine
- [x] 2.1 Add a helper that resolves one field's seed value through the precedence chain: `initialValues` → `schema.defaultValues` → `field.defaultValue` → `undefined` (`resolveFieldSeed`, plus `registerEntry`/`instantiateArrayItem` threading a parallel `defaultValue` drill alongside the existing `initialValue` one)
- [x] 2.2 Use it in `registerEntry`'s initial seeding (currently `getAtPath(initialValues, key)` at setup, in `useFormEngine.ts`)
- [x] 2.3 Use the same resolution in `resetForm()`'s `source` fallback (currently `nextValues ?? initialValues`) — also fixed the array-resize target-length lookup and both `dirty` comparisons (`getFieldBinding`'s `onUpdate:modelValue` and `setValues`), which previously compared against raw `initialValues` and would have wrongly marked an untouched defaulted field as dirty

## 3. Verification
- [x] 3.1 Playground coverage in the root `src/App.vue`: `country` uses a field-level `defaultValue` ('USA'), `schema.defaultValues` seeds `category` ('general') and also sets `tags` to a value that `initialValues.tags` (['vue','docker']) correctly overrides
- [x] 3.2 Type-checked (root project + the shadcn-vue example, which imports this engine) and manually verified in-browser: `country` input holds "USA", the category `<select>` holds "general", and `tags` inputs hold "vue"/"docker" (not the schema-default placeholder), confirming the full precedence chain
