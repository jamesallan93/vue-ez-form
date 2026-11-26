# Examples

## `examples/shadcn-vue`

A full, runnable app in this repo (`examples/shadcn-vue`) wiring EzForm up to real
[shadcn-vue](https://www.shadcn-vue.com) components (`Field`, `Input`, `NumberField`,
`Select`, `Checkbox`, `Alert`) and demonstrating:

- A basic form with a [zod](https://zod.dev) validator and a plain [yup](https://github.com/jquense/yup)
  validator side by side, both Standard Schema natively, neither needing an adapter.
- A nested-group form exercising cross-field validation across a nested group child.
- A fully custom per-field [slot](/guide/slots.md) bypassing `componentMap` entirely.
- `number` fields using real `Intl.NumberFormatOptions` (currency, percent).
- A grid layout form: a 2-column row, a 3-column row, a real shadcn `Alert` rendered via a
  static-entry slot override, a `Select`, and a `Checkbox` gating the submit button's
  `disabled` state directly off `state.fields`.
- A global [`ez-form.config.ts`](/guide/global-config.md); no `<Form>` in the whole app
  passes a local `componentMap` prop.

Run it:

```bash
docker compose up shadcn-example
```

Then open <http://localhost:5175>. See `examples/shadcn-vue/README.md` for the full
rundown, including why it's set up as an npm workspace (a plain nested install created a
second physical `vue` copy that broke both type-checking and the Vue runtime itself).
