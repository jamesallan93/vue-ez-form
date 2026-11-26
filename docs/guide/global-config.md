# Global config

Passing `componentMap` to every `<Form>` gets repetitive once an app has more than one
form. Install it once, app-wide, as a plugin.

## `ez-form.config.ts`

```ts
// ez-form.config.ts
import { defineEzFormConfig } from 'vue-ez-form'
import TextInput from './src/components/inputs/TextInput.vue'
import NumberInput from './src/components/inputs/NumberInput.vue'

export default defineEzFormConfig({
  components: {
    text: TextInput,
    number: NumberInput,
  },
})
```

`defineEzFormConfig` is a plain identity function; it exists only for type inference and
editor support in a dedicated config file. EzForm never reads this file itself. You import
it and hand it to the plugin yourself.

## Install it

```ts
// main.ts
import { createApp } from 'vue'
import { createEzForm } from 'vue-ez-form'
import ezFormConfig from '../ez-form.config'
import App from './App.vue'

createApp(App).use(createEzForm(ezFormConfig)).mount('#app')
```

Every `<Form>` in the app now resolves `componentMap` from this config via `provide`/
`inject`. No `component-map` prop needed anywhere.

## Local overrides still work

A `<Form>` instance's own `componentMap` prop is merged over the injected global config,
with the local entries winning per `type` key:

```vue
<!-- app-wide config has { text, select }; this form overrides just 'select' -->
<Form :schema="schema" :component-map="{ select: SpecialSelectInput }" />
```

That form renders `SpecialSelectInput` for `'select'` fields and the global `TextInput`
for `'text'` fields, with no need to repeat the whole map locally.

## No plugin installed?

Nothing changes. `Form.vue` just dispatches purely from its own `componentMap` prop,
exactly as it did before this capability existed.
