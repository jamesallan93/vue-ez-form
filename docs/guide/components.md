# Bring your own components

EzForm bundles no `<Input>`, `<Select>`, `<Checkbox>`, nothing. `Form.vue` dispatches
every real input field to whatever you registered under `componentMap[field.type]`.

## The contract: `FieldBinding`

Whatever component you register receives this, `v-bind`-spread, plus `field.fieldProps`,
`field.label`, `field.required`, `field.description`, `field.placeholder`, and the
resolved `columns`:

```ts
interface FieldBinding<T = unknown> {
  modelValue: T
  error?: string                       // a single message, or undefined when valid
  'onUpdate:modelValue': (value: T) => void
  onBlur: () => void
}
```

A minimal conforming component:

```vue
<script setup lang="ts">
defineProps<{ label?: string; error?: string; placeholder?: string }>()
defineEmits<{ blur: [] }>()
const modelValue = defineModel<string>()
</script>

<template>
  <label v-if="label">{{ label }}</label>
  <input v-model="modelValue" :placeholder="placeholder" :aria-invalid="!!error" @blur="$emit('blur')" />
  <p v-if="error" role="alert">{{ error }}</p>
</template>
```

That's the whole contract. Style it however you want, use whatever UI library you want
(the [shadcn-vue example](/guide/examples.md) wraps reka-ui primitives this exact way),
render it with a design system's own `Field`/`FieldLabel`/`FieldError` wrapper components.
EzForm has no opinion on any of it.

`FieldBinding` only ever carries that one field's own value. If a component needs to read
*other* fields too, that's a separate, opt-in mechanism (`inject(EZFORM_VALUES)`), not
part of this contract. See [the Form API](/guide/form-api.md#fieldbinding) for why.

## Don't reach into a validation library's own field state

If your component is built on top of a validation library's own field-registration helper
(vee-validate's `<VeeField v-slot="{ value, handleChange, errors }">`, for example), it
won't work here as-is. It's pulling `value`/`handleChange`/`errors` from that library's
*own* state, which EzForm's `v-bind="FieldBinding"` never touches. See
[Bring your own validation](/guide/validation.md#the-one-real-gotcha-vee-validate-s-totypedschema)
for the fix (accept `modelValue`/`error` as plain props instead).

## Registering `componentMap`

Two ways, and they compose:

```vue
<Form :schema="schema" :component-map="{ text: TextInput, select: SelectInput }" />
```

or, once, app-wide. See [Global config](/guide/global-config.md).

## Per-field overrides

Need one specific field to render something `componentMap` dispatch can't express?
`Form.vue` exposes a named slot per field (keyed by the field's own name), input or
static. See [Slots](/guide/slots.md).
