# The Form API

## Props

| Prop | Type | Required |
|---|---|---|
| `schema` | `FormSchema` | yes |
| `componentMap` | `Record<string, Component>` | no, see [Global config](/guide/global-config.md) |
| `initialValues` | `Record<string, unknown>` | no, see [Default values](/guide/default-values.md) |

## Events

| Event | Payload |
|---|---|
| `submit` | `Record<string, unknown>`: the full reconstructed values, once every field/group/array passes |
| `invalid` | `FormState`: the current state, once at least one field/group/array fails |

## Exposed (via a template `ref`)

`Form.vue` renders no submit button or any other opinionated UI chrome. You call these
yourself:

```ts
interface FormExposed {
  submitForm(): Promise<void>
  resetForm(values?: Record<string, unknown>): void
  setValues(values: Record<string, unknown>): void
  state: FormState           // reactive, read directly in a template
  values: Record<string, unknown>
  dirtyValues: Record<string, unknown> // only the fields whose value differs from its seed
}
```

```vue
<script setup lang="ts">
const formRef = ref<InstanceType<typeof Form> | null>(null)
</script>

<template>
  <Form ref="formRef" :schema="schema" />
  <button :disabled="!formRef?.state.fields.confirm?.value" @click="formRef?.submitForm()">
    Submit
  </button>
</template>
```

That example reads `state` directly to gate a submit button on a checkbox's live value.
No event round-trip needed, since `state` is the same reactive object the engine itself
mutates.

## FieldBinding

```ts
interface FieldBinding<T = unknown> {
  modelValue: T
  error?: string
  'onUpdate:modelValue': (value: T) => void
  onBlur: () => void
}
```

`error` is only populated once a field has been touched (blurred) **or** the form has had
at least one submit attempt. Never on a freshly-rendered, untouched field, even if it's
currently invalid.

`FieldBinding` only ever carries that one field's own value, not the whole form's. If a
component needs to read other fields too (a field whose validity or display depends on a
sibling, say), read the whole form's current `values` with `inject`:

```ts
import { inject } from 'vue'
import { EZFORM_VALUES } from 'vue-ez-form'

const formValues = inject(EZFORM_VALUES) // ComputedRef<Record<string, unknown>> | undefined
// formValues.value.email, formValues.value.shipping.city, etc.
```

## NativeFieldBinding

`FieldBinding` is shaped for a Vue component using `v-model` (`modelValue`/
`onUpdate:modelValue`); it doesn't work spread directly onto a raw `<input>`, since a
native element has no such convention to bind onto. For that, `v-bind` this instead:

```ts
interface NativeFieldBinding<T = unknown> {
  value: T
  name: string
  onInput: (event: Event) => void
  onBlur: () => void
}
```

```vue
<Form :schema="schema">
  <template #email="{ native, binding }">
    <input v-bind="native" />
    <p v-if="binding.error">{{ binding.error }}</p>
  </template>
</Form>
```

Covers text-like inputs only (it reads/writes `.value` as a string, the same way the DOM
itself does). A checkbox, radio, or numeric field needing a real typed value should use
`binding`/`componentMap` on a wrapping component instead, the same way vee-validate's own
`field` slot prop needs its `type` prop to special-case those.

Every `<Form>` instance `provide`s its own `values` under this key, so any descendant
component is reactive to the whole form, not just its own field, and it updates on every
keystroke anywhere in the form. This is why it's `inject`, not a prop EzForm passes to
every dispatched component directly: a component that doesn't declare a prop it's handed
gets it dumped onto its root element as a stray DOM attribute (Vue's default `inheritAttrs`
fallthrough), which would happen to every existing input component the moment EzForm
started passing `values` as a prop whether or not that component cared about it.

A per-field slot override gets it more directly, no `inject` needed, since the slot scope
already hands it over as `values` alongside `field`/`binding`:

```vue
<template #email="{ binding, values }">
  <input :value="binding.modelValue" :disabled="values.sameAsBilling === 'no'" />
</template>
```

## `FormState`

```ts
interface FormState {
  fields: Record<string, FieldState>     // value, errors, touched, dirty, validating
  groupErrors: Record<string, string[]>
  arrayLengths: Record<string, number>
  arrayErrors: Record<string, string[]>
  submitAttempted: boolean
  isSubmitting: boolean
  isValid: boolean
}
```

Every key in `fields`/`groupErrors`/etc. is the full dotted path from the schema root,
like `shipping.address.street` or `specialties.0.title`, never a flat, unqualified name.
