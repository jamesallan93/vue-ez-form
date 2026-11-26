<p align="center">
  <img src="./Vue-Ez-form.svg" alt="EzForm logo" width="160" />
</p>

# EzForm

A validator-agnostic, component-agnostic Vue 3 form engine. EzForm ships no input
components and no validation library; you bring your own of each. EzForm's engine owns
the field state (value/error/touched/dirty) and the renderer dispatches to your own
`componentMap`.

**Full documentation: [docs/](docs/)**. Run it locally with `docker compose up docs`,
then open <http://localhost:8080>.

# Why I made this?

I previously created a number of projects where I created a dynamic, schema based form and used it with different validation libraries.
I wanted to create a high quality, reusable component which could take a declarative schema and display a form.
This would allow a developer to choose their own UI components and validation library (such as zod, valibot and/or yup, or even a basic function) rather than being restricted to one. Although I was influenced by Vueform and TanStack Form.
My aim was to create something simpler and more specialised for the dynamic form creation area.
Also I wanted to explore AI driven development using specs, tracking what's built and what's still needed with [OpenSpec](https://openspec.dev).

## Repo layout

- `src/`: the library itself (`Form.vue`, `useFormEngine`, the plugin, types).
- `docs/`: the [VuePress](https://vuepress.vuejs.org) documentation site.
- `examples/shadcn-vue`: a full runnable app wiring EzForm up to real shadcn-vue
  components, vee-validate, and zod. See its own README.
- `openspec/`: spec-driven change tracking for this project (`openspec/specs`,
  `openspec/changes/archive`).

## Development

This project runs entirely in Docker. See `compose.yaml` for each service:

```bash
docker compose up app             # the library's own playground, http://localhost:5174
docker compose up shadcn-example  # the shadcn-vue example app,    http://localhost:5175
docker compose up docs            # the documentation site,       http://localhost:8080
```

Type-check and lint (run inside the `app` container):

```bash
npm run type-check
npm run lint
```

## Status

Published on npm as [`vue-ez-form`](https://www.npmjs.com/package/vue-ez-form):

```bash
npm install vue-ez-form
```

See [docs/guide/getting-started.md](docs/guide/getting-started.md) for the full setup.
