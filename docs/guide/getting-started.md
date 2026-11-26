# Getting Started

## Install

```bash
npm install vue-ez-form
```

`vue` is a peer dependency — install it too if your project doesn't already have it:

```bash
npm install vue
```

## 1. Write a component for each input type

EzForm ships no input components. You need at least one, and it just has to accept the
[`FieldBinding`](/guide/form-api.md#fieldbinding) contract:

```vue
<!-- TextInput.vue -->
<script setup lang="ts">
defineProps<{
  label?: string
  description?: string
  required?: boolean
  error?: string
  placeholder?: string
  columns?: number
}>()
defineEmits<{ blur: [] }>()
const modelValue = defineModel<string>()
</script>

<template>
  <label v-if="label">{{ label }}<span v-if="required">*</span></label>
  <input v-model="modelValue" :placeholder="placeholder" :aria-invalid="!!error" @blur="$emit('blur')" />
  <p v-if="error">{{ error }}</p>
</template>
```

## 2. Register it once, app-wide

Rather than importing `TextInput` into every component that renders a `<Form>`, register
it once in a dedicated config file, the same way you'd configure a Nuxt module or a
Vite plugin:

```ts
// ez-form.config.ts
import { defineEzFormConfig } from 'vue-ez-form'
import TextInput from './src/components/inputs/TextInput.vue'

export default defineEzFormConfig({
  components: {
    text: TextInput, // the 'type' key every schema field below dispatches by
  },
})
```

`defineEzFormConfig` is a plain identity function; it exists only for type inference in
this file. EzForm never reads it itself. You import it and hand it to the plugin:

```ts
// main.ts
import { createApp } from 'vue'
import { createEzForm } from 'vue-ez-form'
import ezFormConfig from '../ez-form.config'
import App from './App.vue'

createApp(App).use(createEzForm(ezFormConfig)).mount('#app')
```

That's it. Every `<Form>` anywhere in the app now resolves `'text'` (and whatever else
you add to `components` later) without ever importing `TextInput` or passing a
`componentMap` prop again. See [Global config](/guide/global-config.md) for how a single
`<Form>` instance can still locally override or extend this app-wide map when it needs to.

## 3. Describe your form as a schema

```ts
import { z } from 'zod'
import type { FormSchema } from 'vue-ez-form'

const schema: FormSchema = {
  fields: {
    name: {
      type: 'text', // resolves to the TextInput registered in ez-form.config.ts
      name: 'name',
      label: 'Full name',
      required: true,
      validate: z.string().min(1, 'Name is required'),
    },
  },
}
```

## 4. Render it

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Form } from 'vue-ez-form'

const formRef = ref<InstanceType<typeof Form> | null>(null)

function onSubmit(values: Record<string, unknown>) {
  console.log(values) // { name: '...' }
}
</script>

<template>
  <!-- no componentMap prop: 'text' resolves from ez-form.config.ts -->
  <Form ref="formRef" :schema="schema" @submit="onSubmit" />
  <button @click="formRef?.submitForm()">Submit</button>
</template>
```

That's a complete, working form. EzForm never rendered a submit button or any wrapper
markup; the two lines above are yours.

## Next

- Read [Global config](/guide/global-config.md) for the full story: local overrides,
  precedence, and what happens with no plugin installed at all.
- Read [the schema shape](/guide/schema.md) for groups, arrays, static content, and column
  layout.
- Read [Bring your own validation](/guide/validation.md) for the exact rules around what a
  `validate` can be.
