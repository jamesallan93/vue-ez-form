# Slots

Every field gets a named slot, keyed by the field's own name (its full dotted path, like
`shipping.address.street` for a nested one), with `componentMap` dispatch as the fallback
when the slot isn't filled.

## Input fields

```vue
<Form :schema="schema">
  <template #email="{ field, native, binding }">
    <div class="my-custom-wrapper">
      <input v-bind="native" />
      <span v-if="binding.error">{{ binding.error }}</span>
    </div>
  </template>
</Form>
```

That field fully bypasses `componentMap`. Every other field is unaffected and still
dispatches normally. `native` is `v-bind`-ready for a raw element (see
[the Form API](/guide/form-api.md#nativefieldbinding)); `binding` is the `modelValue`-
shaped one meant for a Vue component, still handed over for cases like reading `.error`
above, or for wrapping a component instead of a raw element.

## Static entries

A `type: 'static'` entry gets the same treatment, useful when you need something richer
than a single tag with text content (a real alert component with an icon and nested
title/description, say):

```vue
<Form :schema="schema">
  <template #notice>
    <Alert>
      <Terminal class="size-4" />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>Read every field carefully.</AlertDescription>
    </Alert>
  </template>
</Form>
```

Unslotted, it falls back to exactly `<component :is="field.tag">{{ field.content }}</component>`.

## Array fields

An array field's slot receives `{ field, length, add, remove }` instead of a `binding`.
See [Groups & arrays](/guide/groups-and-arrays.md#array-operations).

## The `header`/`fields` slots

`Form.vue` also has two un-keyed structural slots: `header` (rendered before the fields,
empty by default) and `fields` (the whole field list, defaulting to rendering every
top-level schema entry in order). Overriding `fields` lets you fully control layout while
still using the engine underneath. Rare, but there if you need it.
