## 1. Implementation
- [x] 1.1 Add `NativeFieldBinding<T>` to `src/types/field-state.ts`
- [x] 1.2 Add `getNativeFieldBinding(name)` to `FormEngine` (type + implementation)
- [x] 1.3 Expose `native` in `Form.vue`'s per-field named slot scope

## 2. Verification
- [x] 2.1 Verified in-browser: added a `#email` slot override in the root playground using `v-bind="native"` on a raw `<input>`; confirmed the real DOM element is a bare `<input name="email">` with no wrapper component, that typing writes the value into the engine, and that blurring triggers validation and surfaces `binding.error` ("Invalid email address") from the same slot scope
- [x] 2.2 Type-checked (root project + the shadcn-vue example)
