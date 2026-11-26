## 1. Implementation
- [x] 1.1 Export `EZFORM_VALUES: InjectionKey<ComputedRef<Record<string, unknown>>>` from `src/plugin.ts`
- [x] 1.2 `Form.vue`: `provide(EZFORM_VALUES, values)` where `values` is the same computed already used for `defineExpose`
- [x] 1.3 Add `:values="engine.values"` to the array, static, and input slot scope objects (not as a direct prop on the dispatched component itself)

## 2. Verification
- [x] 2.1 Verified via a temporary debug probe (inject + watchEffect + console.log, then reverted) in the shadcn-vue example's TextInput.vue: `inject(EZFORM_VALUES)` returns a reactive ComputedRef reflecting the whole form, confirmed it updates live on keystroke in another field (`{"name":"","email":""}` → `{"name":"Jane","email":""}`)
- [x] 2.2 Confirmed no stray `values` DOM attribute appears on any rendered component (`document.querySelectorAll('[values]')` returns empty)
- [x] 2.3 Type-checked (root project + the shadcn-vue example)
