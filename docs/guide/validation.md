# Bring your own validation

A field (or group, or array)'s `validate` accepts:

```ts
type FieldValidator =
  | StandardSchemaV1              // zod, valibot, arktype, yup 1.6+, ...
  | ((value: unknown) => string | true)
```

Or an array of either, run in order with the **first failure winning** (later validators
in the chain never run once one fails).

```ts
validate: [requiredCheck, formatCheck] // formatCheck only runs if requiredCheck passes
```

## Standard Schema libraries need no adapter

[Standard Schema](https://standardschema.dev) is a small, shared interface
(`schema['~standard'].validate(value)`) that several validation libraries implement
natively. If a library implements it, its schema objects work directly as `validate`.
EzForm calls `~standard.validate`, awaits it if it's async, and maps whatever comes back.

```ts
import { z } from 'zod'
validate: z.string().email('Invalid email address')
```

```ts
import { string } from 'yup'
// yup 1.6+ implements '~standard' natively, confirmed: `'~standard' in yup.string()` is `true`
validate: string().email('Invalid email address').required('Email is required')
```

Valibot and arktype schemas work the same way, directly, with zero EzForm-specific code.

## A plain function

```ts
validate: (value) => (value ? true : 'Required')
```

Return `true` for success, or a single error message string for failure. This is the
escape hatch for a one-off rule that doesn't need a whole schema library.

::: warning Must be synchronous
A plain function is *not* awaited. Only a Standard Schema object's `validate` is. If you
need async validation (an API call, say), use a Standard Schema object (most libraries
support async refinements), not a plain function that returns a `Promise`.
:::

## The one real gotcha: vee-validate's `toTypedSchema()`

vee-validate is a full alternative form library with its own field/state layer
(`<VeeField>`, `useField`). **Don't use that layer with EzForm.** EzForm's own engine is
the sole owner of a field's value/error/touched state (see
[Introduction](/guide/README.md)); registering the same field with vee-validate's
`<VeeField>` *too* creates two separate, un-synced sources of truth for the same field.

If you already have yup/zod schemas written for vee-validate's own `toTypedSchema()`
helper, know that **its return value is not Standard-Schema compliant**, verified
directly against the installed package:

```ts
import { toTypedSchema } from '@vee-validate/yup'
import { string } from 'yup'

toTypedSchema(string().email())
// => { __type: 'VVTypedSchema', parse, cast, describe }, no '~standard' property
```

So you can't hand that object to EzForm's `validate` as-is. Two ways out:

1. **Usually simplest**: skip `toTypedSchema()` entirely and pass the yup/zod schema
   directly; it's already Standard-Schema compliant on its own.
2. If you specifically want vee-validate's own typed-schema wrapper, write a small adapter
   around its `TypedSchema.parse()` method:

   ```ts
   import type { TypedSchema } from 'vee-validate'
   import type { StandardSchemaV1 } from '@standard-schema/spec'

   function veeTypedSchema(schema: TypedSchema): StandardSchemaV1 {
     return {
       '~standard': {
         version: 1,
         vendor: 'vee-validate',
         async validate(value: unknown) {
           const result = await schema.parse(value)
           if (!result.errors.length) return { value: result.value }
           return { issues: result.errors.flatMap((e) => e.errors.map((message) => ({ message }))) }
         },
       },
     }
   }
   ```

Either way, vee-validate's `<VeeField>`/`useField` is never involved. Only its validation
*logic*, if you want it.
