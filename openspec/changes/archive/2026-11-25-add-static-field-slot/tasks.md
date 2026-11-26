## 1. Implementation
- [x] 1.1 Wrap the static-entry branch in `Form.vue` with a `<slot :name="fieldKey" :field="field">` carrying the existing `<component :is="field.tag">` as fallback content

## 2. Spec and verification
- [x] 2.1 Update `form-renderer/spec.md` with a requirement + scenario
- [x] 2.2 Type-check and manual browser verification (used live by the shadcn-vue example's Alert field, which renders a real shadcn Alert/AlertTitle/AlertDescription via this new slot)
