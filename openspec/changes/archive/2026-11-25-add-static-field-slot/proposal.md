## Why

A static entry (`type: 'static'`) can currently only render via `field.tag`/`field.content` —
plain text inside a single tag. A consumer wanting a real design-system component there (e.g.
shadcn-vue's `Alert`/`AlertTitle`/`AlertDescription`, which needs an icon plus two nested
elements) has no way to do it, unlike every input field, which already gets a per-field named
slot override. This surfaced building the shadcn-vue example, which needed a full `Alert`
block as a schema entry.

## What Changes

- `Form.vue` now wraps static-entry rendering in the same per-field named slot convention
  input fields already use: `<slot :name="fieldKey" :field="field"><component :is="field.tag">
  ...</component></slot>`. Default (unslotted) behavior is unchanged — this is purely
  additive.

## Capabilities

### Modified Capabilities
- **form-renderer**: static entries can now be fully overridden via the same per-field slot
  mechanism as input fields.

## Impact

- Affected code: `src/components/Form.vue` only.
- No breaking change — existing static-entry usage (no slot filled) renders identically.
