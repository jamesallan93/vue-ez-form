---
# This RC of @vuepress/theme-default reads `type: home` (not the older `home: true`) to
# pick the Home layout, and a nested `hero: {...}` (not flat heroText/tagline/actions).
# Both verified against the installed package's VPHomeHero.vue / useThemePageData.js.
type: home
title: Home
hero:
  name: EzForm
  image: /logo.svg
  tagline: A validator-agnostic, component-agnostic Vue 3 form engine
  actions:
    - text: Get Started
      link: /guide/getting-started.md
      theme: brand
    - text: Why EzForm?
      link: /guide/README.md
      theme: alt
features:
  - title: Bring your own components
    details: EzForm ships zero input components. You register your own design system's Text/Select/Number/whatever components once, and the schema dispatches to them by a `type` key.
  - title: Bring your own validation
    details: Any Standard Schema-compliant library (zod, valibot, arktype, yup 1.6+) works directly as a field's `validate`, or a plain function works too. No validator-specific adapter, no lock-in.
  - title: The engine owns the state
    details: Value, error, touched, and dirty tracking live in EzForm's own reactive engine, not in a validation library's runtime. You can swap validators without changing how the form behaves.
---

## Why EzForm exists

Most Vue form libraries bundle a validation library, a set of input components, or both.
EzForm bundles neither. It is the layer in between: a schema shape, a state engine, and a
renderer that dispatches to *your* components and runs *your* validators.

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

Head to [Getting Started](/guide/getting-started.md) to see this run end to end, or jump
straight to [the schema shape](/guide/schema.md) if you'd rather read the model first.
