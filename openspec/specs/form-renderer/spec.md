## Purpose

`Form.vue` — the component that walks a `FormSchema` recursively and renders it, dispatching
each input field to the developer's own `componentMap`. EzForm ships no input components of
its own; `componentMap` is the real contract.

## Requirements

### Requirement: Component rendering is fully developer-supplied
`Form.vue` SHALL accept an optional `componentMap: Record<string, Component>` prop and SHALL
dispatch every `InputFieldEntry` to the resolved map's `[field.type]`. EzForm SHALL NOT bundle
its own input components as part of the library's required dependencies.

#### Scenario: Dispatching to a developer's component
- **WHEN** `componentMap = { text: MyTextInput }` and the schema has a field with `type: 'text'`
- **THEN** `Form.vue` renders `MyTextInput`, bound with that field's `FieldBinding`

### Requirement: Component map may be configured app-wide via a plugin
A consumer SHALL be able to install an `EzFormConfig` (`{ components: Record<string,
Component> }`) once, app-wide, via `createEzForm(config)` and `app.use(...)`, instead of
passing `componentMap` to every `<Form>` instance. `Form.vue` SHALL resolve its effective
component map by merging the injected app-wide config's `components` with its own local
`componentMap` prop, with the local prop's entries taking precedence per type key.

#### Scenario: Resolving from the app-wide config alone
- **WHEN** `app.use(createEzForm({ components: { text: MyTextInput } }))` was installed and a
  `<Form>` is rendered with no `componentMap` prop
- **THEN** a field with `type: 'text'` still renders `MyTextInput`

#### Scenario: A local componentMap prop overrides one entry
- **WHEN** the app-wide config provides `{ text: MyTextInput, select: MySelectInput }` and a
  `<Form>` instance passes `componentMap: { select: SpecialSelectInput }`
- **THEN** that form renders `MyTextInput` for `'text'` fields (from the app-wide config) and
  `SpecialSelectInput` for `'select'` fields (the local override), without needing to repeat
  the `text` entry locally

#### Scenario: No plugin installed, prop used directly
- **WHEN** no `createEzForm` plugin was ever installed
- **THEN** `Form.vue` behaves exactly as it did before this capability existed — it dispatches
  purely from its own `componentMap` prop

### Requirement: Per-field slot override
For every field, `Form.vue` SHALL expose a named slot (keyed by the field's name) receiving
`{ field, binding, native }`, letting a consumer fully override that one field's rendering
while falling back to `componentMap` dispatch when the slot isn't filled.

#### Scenario: Overriding one field's rendering
- **WHEN** a consumer fills the slot named `"customField"` with their own markup
- **THEN** that markup renders instead of `componentMap`'s default for that field, while every
  other field still uses `componentMap` dispatch

#### Scenario: Binding straight onto a raw native element
- **WHEN** a consumer `v-bind`s the slot's `native` prop directly onto a native
  `<input>`/`<textarea>`/`<select>`, instead of using `binding` on a Vue component
- **THEN** typing into that element updates the field's value and triggers the same
  touched/validate side effects as `binding`'s `onUpdate:modelValue`/`onBlur` would on a
  component, with no wrapper component required

### Requirement: The whole form's values are reachable from any descendant component
`FieldBinding` carries only one field's own value, never the whole form's. `Form.vue`
SHALL `provide` the whole form's reconstructed `values` (the same object `engine.values`
exposes) so any descendant component, whether dispatched via `componentMap` or rendered
inside a custom per-field slot at any depth, can read it with `inject`. It SHALL NOT pass
`values` as a prop directly to every `componentMap`-dispatched component, since a
component that doesn't declare an unused prop it's handed receives it as a stray DOM
attribute instead (Vue's default `inheritAttrs` fallthrough). Every per-field slot's scope
object (input, static, and array) also carries `values` directly, alongside `field`/
`binding`, for a plain destructure instead of an `inject` call.

#### Scenario: A componentMap-dispatched component reads a sibling field's value
- **WHEN** a component dispatched via `componentMap` calls `inject(EZFORM_VALUES)`
- **THEN** it receives a `ComputedRef` reflecting the whole form's current values, reactive
  to every field's changes, not just its own

#### Scenario: No stray DOM attribute from the unused values prop
- **WHEN** an existing `componentMap`-dispatched component does not declare a `values` prop
- **THEN** its rendered root element carries no `values` attribute

#### Scenario: A slot override reads the whole form without inject
- **WHEN** a consumer fills a field's named slot and destructures `{ binding, values }`
- **THEN** `values` is the same whole-form values object available via `inject`, with no
  `inject` call needed

### Requirement: Static entries can be overridden via the same per-field slot
A `StaticFieldEntry` SHALL also expose a named slot (keyed by the field's name) receiving
`{ field }`, falling back to `<component :is="field.tag">{{ field.content }}</component>`
when the slot isn't filled — the same convention input fields use, since a static entry may
need a real design-system component (e.g. an alert with an icon and nested title/description)
rather than a single tag with text content.

#### Scenario: Overriding a static entry's rendering
- **WHEN** a consumer fills the slot named for a `type: 'static'` entry with their own markup
- **THEN** that markup renders instead of the default `<component :is="field.tag">`

#### Scenario: Unslotted static entry is unchanged
- **WHEN** a `type: 'static'` entry's slot is not filled
- **THEN** it renders exactly as before — `<component :is="field.tag">{{ field.content }}</component>`

### Requirement: Groups render recursively with a group-error display
A `GroupFieldEntry` SHALL render its nested `fields` recursively (reusing the same renderer),
and SHALL display `state.groupErrors[name]` when present, separately from any single field's
error.

#### Scenario: Displaying a cross-field group error
- **WHEN** `state.groupErrors.passwordGroup` contains `"Passwords must match"`
- **THEN** that message renders within the group's own markup, not attached to any single
  child field's error slot

### Requirement: Column distribution defaults, field value always wins
When rendering a group's children, `Form.vue` SHALL compute a default column width via
`distributeColumns(childCount)` and pass it down; a child's own explicit `field.columns` SHALL
always take precedence over that computed default.

#### Scenario: A field with no explicit columns
- **WHEN** a group has 3 children and none specify `columns`
- **THEN** each child receives `columns: 4` (12 / 3) from the group's computed default

#### Scenario: A field with explicit columns overrides the default
- **WHEN** a group has 3 children and one specifies `columns: 8`
- **THEN** that one child receives `8`, not the group's computed default

### Requirement: Imperative access via template ref, no bundled submit UI
`Form.vue` SHALL expose `submitForm`, `resetForm`, `setValues`, `state`, and `values` via
`defineExpose`, for a consumer to call from a `ref`. `Form.vue` SHALL NOT render its own
submit button or any other opinionated UI chrome.

#### Scenario: Triggering submit from an external button
- **WHEN** a consumer renders `<button @click="formRef.submitForm()">` outside `<Form>`
- **THEN** that call runs the same submit flow as an internal trigger would

### Requirement: Array entries render their items template repeatedly
`Form.vue` SHALL render an `ArrayFieldEntry` by instantiating its `items` template once per
current array length, passing each instance the index-qualified field key, and SHALL expose
add/remove operations to the consumer.

#### Scenario: Rendering a list of object items
- **WHEN** an `ArrayFieldEntry` named `specialties` currently has 2 items
- **THEN** `Form.vue` renders the `items` group twice, once bound to `specialties.0.*` keys and
  once to `specialties.1.*` keys

#### Scenario: Add/remove controls reach the consumer
- **WHEN** a consumer needs to render "Add" / "Remove" buttons for an array field
- **THEN** `Form.vue` exposes the engine's add/remove operations for that array (e.g. via the
  per-field named slot already used for single-field override)

#### Scenario: Every array operation reaches the consumer, not just add/remove
- **WHEN** a consumer fills an array field's named slot
- **THEN** it also receives `insert`, `prepend`, `swap`, `move`, `update`, and `replace`,
  each already bound to that array's own path, alongside `add`/`remove`

### Requirement: Array rendering nests to arbitrary depth
When an `ArrayFieldEntry.items` is itself an `ArrayFieldEntry`, `Form.vue` SHALL render it by
recursing through the same array-rendering branch again — no depth limit, no special-casing.

#### Scenario: Rendering an array of arrays
- **WHEN** a field's `items` is `{ type: 'array', items: { type: 'text', name: 'cell' } }`
- **THEN** each outer item renders its own nested repeatable list of cells, with its own
  independent Add/Remove controls, verified end-to-end (render, add, remove-with-reindex,
  submit) via a matrix (array of arrays of text) playground example
