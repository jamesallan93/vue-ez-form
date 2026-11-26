## Purpose

Defines the declarative schema shape a developer writes to describe a form: a tree of named
field entries (`src/types/field.ts`). Deliberately validator-agnostic and component-agnostic —
no specific validation library or UI component is ever imported by the schema types themselves.

## Requirements

### Requirement: Field entries are a discriminated union
A `FieldEntry` SHALL be exactly one of: a static (visual-only) entry, a group of nested
entries, or an input entry dispatched to a user-supplied component.

#### Scenario: Narrowing by discriminant
- **WHEN** code checks `field.type === 'static'`
- **THEN** TypeScript narrows the value to `StaticFieldEntry`, excluding `name`/`validate`
- **WHEN** code checks `'fields' in field`
- **THEN** TypeScript narrows the value to `GroupFieldEntry`

### Requirement: Static entries carry no validation
A `StaticFieldEntry` (`type: 'static'`) SHALL only describe visual content (`tag`, `content`,
`class`) and SHALL NOT be a target for validation or `componentMap` dispatch.

#### Scenario: Static entry is skipped by the engine
- **WHEN** the engine walks the schema and finds an entry with `type: 'static'`
- **THEN** it registers no `FieldState` for that entry and never calls a validator on it

### Requirement: Group entries nest recursively and support cross-field validation
A `GroupFieldEntry` SHALL hold nested `fields` keyed by name, and MAY carry its own
`validate` run against the group's own values (`{ [childName]: value }`), for checks that
span more than one child field.

#### Scenario: Cross-field issue routes to a specific child
- **WHEN** a group's validator returns an issue with a `path`
- **THEN** that issue is attributed to the child field named by `path[0]`

#### Scenario: Cross-field issue with no path is group-level
- **WHEN** a group's validator returns an issue with no `path`
- **THEN** that issue becomes a group-level error, not attached to any single field

### Requirement: Input entries dispatch to a user-supplied component
An `InputFieldEntry` SHALL have a `name` (its identity) and a `type` (a key into the
developer's own `componentMap`). EzForm SHALL NOT bundle or require any specific input
component implementation.

#### Scenario: Rendering an input field
- **WHEN** `Form.vue` encounters an `InputFieldEntry` with `type: 'text'`
- **THEN** it renders whatever component the developer registered under `componentMap.text`

### Requirement: Validation is validator-agnostic
`FieldValidator` SHALL accept either a Standard Schema-compliant object (zod, valibot, yup,
etc. via `@standard-schema/spec`) or a plain function `(value) => string | true`. EzForm
SHALL NOT depend on, import, or special-case any specific validation library.

#### Scenario: Using a zod schema as a field validator
- **WHEN** a field's `validate` is a zod schema instance
- **THEN** the engine calls it via `schema['~standard'].validate(value)`, identically to any
  other Standard Schema-compliant validator

#### Scenario: Using a plain function as a field validator
- **WHEN** a field's `validate` is `(value) => value ? true : 'Required'`
- **THEN** the engine calls it directly and treats a non-`true` return as a single error message

### Requirement: Required is explicit, never inferred
`InputFieldEntry.required` SHALL be a plain boolean stated directly by the developer.
EzForm SHALL NOT attempt to infer "required" by introspecting a `validate` schema, since
not every validator (e.g. a plain function) can be reliably introspected.

#### Scenario: Required marker with no validator
- **WHEN** a field has `required: true` and no `validate` at all
- **THEN** the rendered label still shows the required marker, since the two are independent

### Requirement: Column distribution is numeric only
`FieldColumns` SHALL be a plain number or `{ container, label, wrapper }` object. EzForm
SHALL NOT encode any CSS framework or class-naming convention in this type — translating a
column number into actual classes is the rendering component's responsibility.

#### Scenario: Component owns the class translation
- **WHEN** `Form.vue` passes `columns={8}` to a developer's component
- **THEN** EzForm itself never generates a CSS class from that number; the component does

### Requirement: Array entries describe a repeatable list
An `ArrayFieldEntry` (`type: 'array'`) SHALL carry an `items` template (itself any
`FieldEntry`, enabling object-shaped items via a group, scalar items via a plain input, or
nested repeated lists), and MAY carry `minItems`/`maxItems` and a whole-array `validate`.

#### Scenario: Object-shaped repeatable items
- **WHEN** an `ArrayFieldEntry.items` is a `GroupFieldEntry` with `title`/`duration` fields
- **THEN** each item in the array is expected to be an object with those two keys

### Requirement: Default values can live in the schema, not just at the call site
An `InputFieldEntry` MAY carry its own `defaultValue`, and a `FormSchema` MAY carry a
top-level `defaultValues` (shaped like `FormEngineOptions.initialValues` — nested objects/
arrays, not a flat dotted-path record). A field's starting value resolves with this
precedence, highest first: `FormEngineOptions.initialValues` → `FormSchema.defaultValues` →
`InputFieldEntry.defaultValue` → `undefined`.

#### Scenario: Field-level default with no initialValues
- **WHEN** a field has `defaultValue: ''` and no `initialValues` or `schema.defaultValues`
  entry exists for it
- **THEN** that field starts as `''`, not `undefined`

#### Scenario: Schema-level default covers several fields at once
- **WHEN** `schema.defaultValues = { name: '', email: '' }` and neither field also sets its
  own `defaultValue`
- **THEN** both fields start from `schema.defaultValues`, without repeating a `defaultValue`
  on each field entry

#### Scenario: initialValues still wins over both
- **WHEN** a field has both `defaultValue: 'fallback'` and an `initialValues` entry of
  `'from caller'`
- **THEN** that field starts as `'from caller'`
