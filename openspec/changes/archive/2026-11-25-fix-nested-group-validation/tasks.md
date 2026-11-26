## 1. Implementation
- [x] 1.1 Update `validateGroup` to refresh nested group/array children via `validateGroup`/`validateArray`, not just `validateField`
- [x] 1.2 Build the cross-field validator's `values` from the reconstructed values tree (`getAtPath(buildValues(false), name)`) instead of direct-child-only lookup
- [x] 1.3 Remove the "Known limitation" note from `openspec/specs/form-engine/spec.md`

## 2. Verification
- [x] 2.1 Playground example: a group nested inside another group, with the outer group's cross-field validator checking the nested group's value
- [x] 2.2 Type-check (`npm run type-check` via Docker) and manual browser verification that the nested value is no longer missing/undefined in the cross-field check
