import type { StandardSchemaV1 } from '@standard-schema/spec'

/**
 * Validates a single field's (or group's) value. Accepts any Standard Schema-compliant
 * object (zod, valibot, yup, arktype, ...) so EzForm never depends on a specific
 * validation library, or a plain function returning `true` on success or an error message.
 */
export type FieldValidator =
  | StandardSchemaV1
  | ((value: unknown) => string | true)

/**
 * Column distribution for a field within the 12-column grid. A single number sets the
 * field's own width; the object form additionally controls its label and input wrapper.
 */
export type FieldColumns =
  | number
  | { container?: number; label?: number; wrapper?: number }

/** Visual-only element: no validation, no COMPONENT_MAP lookup. e.g. headings, <hr>. */
export interface StaticFieldEntry {
  /** Discriminant marking this entry as non-interactive, visual-only content. */
  type: 'static'
  /** HTML/component tag to render, e.g. "h2" or "hr". */
  tag: string
  /** Text content rendered inside `tag`. */
  content?: string
  /** CSS class applied to the rendered element. */
  class?: string
}

/**
 * Container of nested fields, rendered recursively, columns distributed among its children.
 * `validate` runs against the group's own values ({ [childName]: value }), for checks that
 * span more than one field (e.g. password/confirmPassword). An issue's `path` routes the
 * error to that child field; a pathless issue is a group-level error.
 */
export interface GroupFieldEntry {
  /** Nested field entries, keyed by field name. */
  fields: Record<string, FieldEntry>
  /** CSS class applied to the group's wrapper element. */
  class?: string
  /** Column distribution for this group within its parent. */
  columns?: FieldColumns
  /** Cross-field validator(s) run against this group's own values. */
  validate?: FieldValidator | FieldValidator[]
}

/** A real input, dispatched to the user-supplied component for `type` in COMPONENT_MAP. */
export interface InputFieldEntry {
  /** Field name; also the key used when reading/writing this field's value. */
  name: string
  /** Key into the user-supplied COMPONENT_MAP, selecting which component renders this field. */
  type: string
  /** Label text shown alongside the field. */
  label?: string
  /**
   * Marks this field as required for display purposes only (e.g. a `*` next to the label).
   * Stated explicitly by the user rather than inferred from `validate`, since an arbitrary
   * validator (plain function or Standard Schema) can't be reliably introspected for this.
   * Absent or `false` means no marker is shown. There is no global default to override.
   */
  required?: boolean
  /** Helper text shown below the field. */
  description?: string
  /** Placeholder text passed through to the rendered component. */
  placeholder?: string
  /** Validator(s) run against this field's value. */
  validate?: FieldValidator | FieldValidator[]
  /** Extra props passed through as-is to the rendered component. */
  fieldProps?: Record<string, unknown>
  /** CSS class applied to the field's wrapper element. */
  class?: string
  /** Column distribution for this field within its parent. */
  columns?: FieldColumns
  /**
   * This field's own default starting value, used when neither `FormEngineOptions.initialValues`
   * nor `FormSchema.defaultValues` provide one for this field's path. Lowest-priority of the
   * three. See `FormSchema.defaultValues` for the full precedence chain.
   */
  defaultValue?: unknown
}

/**
 * A repeatable list of items, each matching the same `items` template. The template can be
 * a group (object-shaped items, e.g. { title, duration }), a plain input (scalar items like
 * tags), or another array (nested repeated lists). `validate` runs against the array's whole
 * current value, not any single item, for rules like "at least one item required."
 */
export interface ArrayFieldEntry {
  /** Discriminant marking this entry as a repeatable list. */
  type: 'array'
  /**
   * The field entry each item is rendered from. Its own `name` (if an `InputFieldEntry`) is
   * ignored; items are identified by position, not by name.
   */
  items: FieldEntry
  /** Minimum number of items; the UI should disallow removing below this count. */
  minItems?: number
  /** Maximum number of items; the UI should disallow adding above this count. */
  maxItems?: number
  /** Validator(s) run against the array's whole value, not any single item. */
  validate?: FieldValidator | FieldValidator[]
  /** CSS class applied to the list's wrapper element. */
  class?: string
}

/** Any entry in a form schema's `fields` tree: static content, a group, a real input, or an array. */
export type FieldEntry = StaticFieldEntry | GroupFieldEntry | InputFieldEntry | ArrayFieldEntry

/** The root schema passed to the form renderer: a tree of named field entries. */
export interface FormSchema {
  /** Top-level field entries, keyed by field name. */
  fields: Record<string, FieldEntry>
  /**
   * Default starting values, shaped like the schema itself (same nested-object/array
   * convention as `FormEngineOptions.initialValues`, not a flat dotted-path record).
   * Resolved per field with this precedence, highest first:
   * `FormEngineOptions.initialValues` (the `<Form initial-values>` prop) →
   * `FormSchema.defaultValues` → the field's own `InputFieldEntry.defaultValue` →
   * `undefined`. Lets a schema carry its own sane defaults without every consumer having to
   * separately wire up `initialValues` at each `<Form>` call site.
   */
  defaultValues?: Record<string, unknown>
}
