## 1. Config type and plugin
- [x] 1.1 Add `src/types/ez-form-config.ts` with `EzFormConfig { components: Record<string, Component> }`
- [x] 1.2 Add `src/plugin.ts`: an injection key, `createEzForm(config): Plugin`, and `defineEzFormConfig(config)` identity helper

## 2. Form.vue wiring
- [x] 2.1 Make `componentMap` prop optional
- [x] 2.2 Inject the global config (if installed) and merge it with the local prop (local entries win per type key) into the map actually used for dispatch

## 3. Example and docs
- [x] 3.1 Add `ez-form.config.ts` at the project root using `defineEzFormConfig`
- [x] 3.2 Wire `app.use(createEzForm(...))` in `src/main.ts`
- [x] 3.3 Update `App.vue` to drop the local `componentMap` prop entirely, proving full resolution from the app-wide config (merge precedence itself is a straightforward object-spread, covered by the spec scenario rather than a separate visual demo)

## 4. Spec and verification
- [x] 4.1 Update `form-renderer/spec.md` with a requirement + scenarios for global config resolution and local-prop precedence
- [x] 4.2 Type-check (`npm run type-check` via Docker) and manual browser verification that fields still render via the global map
