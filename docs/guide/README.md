# Introduction

EzForm is a Vue 3 form library built around one idea: **the form engine, the input
components, and the validation library are three separate concerns, and none of them
should depend on the other two.**

## The split

| Concern | Who owns it | EzForm's role |
|---|---|---|
| Field value / error / touched / dirty state | EzForm's engine (`useFormEngine`) | Owns it entirely; the only place a validator is ever called from |
| Rendering an input (styling, a11y, interaction) | Your own components | EzForm just dispatches to whatever you register under a `type` key |
| Validation logic | Any Standard Schema library (zod, valibot, yup 1.6+, arktype…) or a plain function | EzForm calls it as a pure function and never holds its own copy of your rules |

This is different from libraries that bundle their own `<Input>`/`<Select>` components, or
that are built tightly around one validation library's own field-registration system
(vee-validate's `<VeeField>`/`useField`, for example, which holds its *own* value/error
state separately from whatever engine wraps it).

## What "component-agnostic" actually means

`Form.vue` never renders an `<input>` itself. It walks your schema and, for every real
input field, renders `componentMap[field.type]`: a component you wrote, registered either
locally (a prop) or globally (see [Global config](/guide/global-config.md)). EzForm hands
that component a small, fixed contract (`modelValue`, `error`, `onUpdate:modelValue`,
`onBlur`; see [the Form API](/guide/form-api.md#fieldbinding)) and nothing more. The
component owns every pixel.

## What "validator-agnostic" actually means

A field's `validate` is either a [Standard Schema](https://standardschema.dev) object or a
plain `(value) => string | true` function. EzForm's engine calls it, awaits it if it
returns a promise, and normalizes whatever comes back into the same shape internally. It
never imports zod, yup, or any other validation package. See
[Bring your own validation](/guide/validation.md) for the full story, including the one
real gotcha (vee-validate's own `toTypedSchema()` wrapper is *not* Standard-Schema
compliant, even though yup and zod themselves are).

## Where to go next

- [Getting Started](/guide/getting-started.md): install it, render your first form.
- [The schema shape](/guide/schema.md): the four kinds of field entry.
- [Bring your own validation](/guide/validation.md)
- [Bring your own components](/guide/components.md)
- [Global config](/guide/global-config.md): register components once, app-wide.
