## Why

Today `componentMap` is a required prop on every single `<Form>` instance. A real app has one
`componentMap` (its design system's Text/Select/Number/etc. inputs) and many forms; repeating
it everywhere is boilerplate and invites drift if one form's map falls out of sync with the
rest. Frameworks like Nuxt solve this with a global config object (`nuxt.config.ts`); the
developer asked for the equivalent here — a dedicated config file (`ez-form.config.ts`)
installed once at the app root, so individual `<Form>` instances don't need to pass
`componentMap` at all.

## What Changes

- Add `EzFormConfig` (`{ components: Record<string, Component> }`) and a Vue plugin,
  `createEzForm(config)`, that provides this config app-wide via `app.use(...)`.
- Add `defineEzFormConfig(config)` — an identity helper purely for type inference/DX when a
  consumer writes a dedicated `ez-form.config.ts` file (mirrors `defineNuxtConfig`-style
  helpers; EzForm does not read this file itself — the consumer imports it and passes it to
  `createEzForm`).
- `Form.vue`'s `componentMap` prop becomes optional. The component injects the global config
  (if a plugin was installed) and merges it with the local prop, with the local prop's entries
  taking precedence per type key — so a single form can still override or extend the map
  without needing a second one.
- Framework-agnostic: this is a plain Vue plugin (provide/inject), not Nuxt-specific, so it
  works the same in plain Vue and in Nuxt. A Nuxt-specific module (reading `ezForm: {...}`
  straight out of `nuxt.config.ts`) is explicitly out of scope for this change.

## Capabilities

### Modified Capabilities
- **form-renderer**: `Form.vue` can resolve `componentMap` from an app-level plugin
  configuration in addition to (or instead of) the local prop.

## Impact

- Affected code: new `src/types/ez-form-config.ts`, new `src/plugin.ts`,
  `src/components/Form.vue` (optional prop + inject + merge), `src/main.ts` / playground wiring
  (`app.use(createEzForm(...))`), new `ez-form.config.ts` example at the project root.
- No breaking change: a consumer who keeps passing `componentMap` directly and never installs
  the plugin sees identical behavior to today.
