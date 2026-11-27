<p align="center">
  <a href="https://vue-ez-form.pages.dev" target="_blank">
    <img src="https://raw.githubusercontent.com/jamesallan93/vue-ez-form/main/Vue-Ez-form.svg" alt="EzForm logo" width="180" title="Go to the docs" />
  </a>
</p>

<h1 align="center">EzForm</h1>

<p align="center">
  Schema driven Vue 3 forms. Your components, your validation.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/vue-ez-form" target="_blank">
    <img src="https://img.shields.io/npm/v/vue-ez-form.svg?label=npm&color=42b883" alt="npm version" />
  </a>
  <img src="https://img.shields.io/badge/Vue-3.5+-42b883?logo=vuedotjs&logoColor=white" alt="Vue 3.5+" />
  <img src="https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white" alt="TypeScript ready" />
  <a href="https://standardschema.dev" target="_blank">
    <img src="https://img.shields.io/badge/Standard_Schema-compatible-8b5cf6" alt="Standard Schema compatible" />
  </a>
  <a href="https://vue-ez-form.pages.dev" target="_blank">
    <img src="https://img.shields.io/badge/docs-vue--ez--form.pages.dev-f97316" alt="docs" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT license" />
  </a>
</p>

<p align="center">
  <a href="https://buymeacoffee.com/jamesallandev" target="_blank">
    <img src="https://raw.githubusercontent.com/jamesallan93/vue-ez-form/main/assets/buy-me-a-coffee.png" alt="Buy me a coffee" width="200" />
  </a>
</p>

<br>

## ✨ Features

- **🧩 Bring your own components:** EzForm ships zero inputs. Register your own design system once and every schema field renders with it.
- **✅ Bring your own validation:** zod, valibot, arktype, yup 1.6+ or any [Standard Schema](https://standardschema.dev) library works as is. A plain function works too.
- **🧠 The engine owns the state:** value, error, touched and dirty tracking live in EzForm, so swapping validators never changes how your form behaves.
- **🗂️ Groups and arrays:** nested groups, repeatable arrays and arrays of groups, all from the same schema.
- **📐 Column layout:** lay fields out in rows and columns straight from the schema.
- **🎯 Slots everywhere:** override any single field with your own markup when the component map is not enough.
- **🪶 Tiny:** about 5 kB gzipped, with Vue as the only peer dependency.

## 📦 Installation

```bash
npm install vue-ez-form
```

> [!WARNING]
> EzForm is in early development and is not fully tested yet. It may contain bugs, so
> think carefully before using it in production.
>
> Found a bug? Please open an issue on
> [GitHub Issues](https://github.com/jamesallan93/vue-ez-form/issues) describing what
> happened and how to reproduce it. Pull requests with a fix are very welcome.
>
> One rule for pull requests: **do not add new dependencies**. EzForm is meant to stay
> small, so any PR that installs a new package will not be accepted.

## 🚀 Quick start

Write one component for each input type, then hand EzForm a schema:

```vue
<script setup lang="ts">
import { Form } from 'vue-ez-form'
import { z } from 'zod'
import TextInput from './TextInput.vue' // your own component, not EzForm's

const schema = {
  fields: {
    email: {
      type: 'text',
      name: 'email',
      label: 'Email',
      validate: z.string().email('Invalid email address'),
    },
  },
}

const componentMap = { text: TextInput }
</script>

<template>
  <Form :schema="schema" :component-map="componentMap" @submit="(values) => console.log(values)" />
</template>
```

Want to register your components once for the whole app? See
[Getting Started](https://vue-ez-form.pages.dev/guide/getting-started) for the full setup.

## 📖 Documentation

Everything lives at **[vue-ez-form.pages.dev](https://vue-ez-form.pages.dev)**:

- [The schema shape](https://vue-ez-form.pages.dev/guide/schema)
- [Bring your own validation](https://vue-ez-form.pages.dev/guide/validation)
- [Bring your own components](https://vue-ez-form.pages.dev/guide/components)
- [Groups and arrays](https://vue-ez-form.pages.dev/guide/groups-and-arrays)
- [The Form API](https://vue-ez-form.pages.dev/guide/form-api)

## 💡 Why I made this

I built a number of projects with a dynamic, schema based form, each paired with a
different validation library. I wanted one high quality, reusable component that takes a
declarative schema and renders a form, while letting the developer pick their own UI
components and validation library (zod, valibot, yup, or even a basic function) instead of
being locked into one.

I was influenced by Vueform and TanStack Form, but my aim was something simpler and more
focused on dynamic form creation. I also wanted to explore AI driven development using
specs, tracking what's built and what's still needed with [OpenSpec](https://openspec.dev).

## 🤝 Contributing

Bug reports and fixes are welcome. See the note under [Installation](#-installation) for
how to report a bug and the one rule for pull requests.

### Development

This project runs entirely in Docker. See `compose.yaml` for each service:

```bash
docker compose up app    # the library's own playground, http://localhost:5174
docker compose up docs   # the documentation site,       http://localhost:8080
```

Type-check and lint inside the `app` container:

```bash
npm run type-check
npm run lint
```

Repo layout:

- `src/`: the library itself (`Form.vue`, `useFormEngine`, the plugin, types).
- `docs/`: the [VuePress](https://vuepress.vuejs.org) documentation site.
- `openspec/`: spec driven change tracking (`openspec/specs`, `openspec/changes/archive`).

## ☕ Support

EzForm is free and built in my spare time. I'm currently between jobs, so if it saves you
some work, a coffee helps me keep going (and keeps my cat fed 🐱).

<a href="https://buymeacoffee.com/jamesallandev" target="_blank">
  <img src="https://raw.githubusercontent.com/jamesallan93/vue-ez-form/main/assets/buy-me-a-coffee.png" alt="Buy me a coffee" width="200" />
</a>

## 📄 License

[MIT](LICENSE)
