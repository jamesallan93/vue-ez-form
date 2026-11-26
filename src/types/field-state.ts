/**
 * The engine's internal, reactive record for a single field. Holds everything the engine
 * needs to decide validity, submit-readiness, and UX timing. Richer than what's handed to
 * the rendered component (see {@link FieldBinding}).
 */
export interface FieldState<T = unknown> {
  /** The field's current value. */
  value: T
  /**
   * All current validation error messages for this field. Plural because a single Standard
   * Schema validation can return multiple issues (e.g. "too short" and "must contain a number").
   */
  errors: string[]
  /** Whether the field has lost focus (blurred) at least once. */
  touched: boolean
  /** Whether the field's value differs from its initial value. */
  dirty: boolean
  /** Whether an async validator is currently running for this field. */
  validating: boolean
}

/**
 * The minimal, stable contract spread onto whatever component `COMPONENT_MAP[field.type]`
 * resolves to. Derived from {@link FieldState} by the engine, kept separate so a component
 * author only ever binds to this small, predictable shape, never to the engine's internals.
 */
export interface FieldBinding<T = unknown> {
  /** The field's current value, for `v-model` binding. */
  modelValue: T
  /** A single error message to display, or undefined when the field has none to show. */
  error?: string
  /** Updates the field's value; wired to `v-model`'s `update:modelValue` event. */
  'onUpdate:modelValue': (value: T) => void
  /** Marks the field as touched; wired to the component's blur event. */
  onBlur: () => void
}

/**
 * The alternative to {@link FieldBinding} for `v-bind`-ing straight onto a native
 * `<input>`/`<textarea>`/`<select>`, instead of a Vue component using `v-model`.
 * `FieldBinding`'s `modelValue`/`onUpdate:modelValue` shape only works on a component that
 * declares a `modelValue` prop and emits `update:modelValue`; a native element has no such
 * convention to spread onto, so this reads/writes `.value` directly from the DOM `input`
 * event instead. Covers text-like inputs only; a checkbox/radio/numeric element needing
 * real typed casting (not a string) should still use {@link FieldBinding} on a wrapping
 * component, the same way vee-validate's own `field` needs a `type` prop to special-case
 * those.
 */
export interface NativeFieldBinding<T = unknown> {
  /** The field's current value, as a plain DOM attribute. */
  value: T
  /** The field's full dotted path, usable as the native `name` attribute. */
  name: string
  /** Updates the field's value from `(event.target as HTMLInputElement).value`. */
  onInput: (event: Event) => void
  /** Marks the field as touched; wired to the element's blur event. */
  onBlur: () => void
}
