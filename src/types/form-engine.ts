import type { FormState } from './form-state'

/** Options accepted when starting the form engine for a schema. */
export interface FormEngineOptions {
  /**
   * Initial values, shaped like the schema itself (nested objects for groups, real arrays
   * for `ArrayFieldEntry`, e.g. `{ specialties: [{ title: 'js', duration: 6 }] }`), not a
   * flat dotted-path record. Fields with no corresponding entry start undefined.
   */
  initialValues?: Record<string, unknown>
}

/**
 * The runtime API returned by the engine composable. Built once per `<Form>` instance from
 * a `FormSchema`; owns the reactive {@link FormState} and every operation that reads or
 * mutates it. This is the one place EzForm calls into the user's validators. Nothing above
 * this layer (the renderer, the rendered components) ever touches a validator directly.
 */
export interface FormEngine {
  /** The engine's live, reactive state: per-field state, group errors, and submit flags. */
  state: FormState
  /**
   * Derives the minimal binding a rendered component needs for one field, from that
   * field's current `FieldState`. Called by the renderer once per field, every re-render.
   */
  getFieldBinding<T = unknown>(name: string): import('./field-state').FieldBinding<T>
  /**
   * The native-element alternative to `getFieldBinding`: `v-bind` straight onto an
   * `<input>`/`<textarea>`/`<select>` instead of a v-model component. Reads/writes
   * `.value` as a string; a field needing real typed values should use `getFieldBinding`
   * on a wrapping component instead.
   */
  getNativeFieldBinding(name: string): import('./field-state').NativeFieldBinding<string>
  /** Runs one field's validator(s) and updates its `errors`/`validating` state. */
  validateField(name: string): Promise<void>
  /** Runs one group's cross-field validator(s), routing issues by `path` into `fields` or `groupErrors`. */
  validateGroup(name: string): Promise<void>
  /** Runs one array's whole-value validator(s), updating `arrayErrors` for that array's path. */
  validateArray(path: string): Promise<void>
  /**
   * Instantiates a new item at the end of an array field (from its `items` template),
   * optionally seeded with `value`, registering its descendants' field/group/array state.
   * A no-op if `maxItems` is already reached.
   */
  addArrayItem(path: string, value?: unknown): void
  /**
   * Removes the item at `index` from an array field and shifts every later item's state down
   * by one index, so indices stay contiguous. A no-op if `minItems` would be violated.
   */
  removeArrayItem(path: string, index: number): void
  /**
   * Inserts a new item at `index` (optionally seeded with `value`), shifting items at or
   * after `index` up by one. `index` must be in `[0, length]`; out of range, or `maxItems`
   * already reached, is a no-op.
   */
  insertArrayItem(path: string, index: number, value?: unknown): void
  /** Sugar for `insertArrayItem(path, 0, value)`. */
  prependArrayItem(path: string, value?: unknown): void
  /**
   * Swaps two items' entire state (value, errors, touched, dirty, nested descendants). A
   * no-op if either index is out of range.
   */
  swapArrayItems(path: string, indexA: number, indexB: number): void
  /**
   * Moves the item at `fromIndex` to `toIndex`, shifting the items in between. A no-op if
   * either index is out of range.
   */
  moveArrayItem(path: string, fromIndex: number, toIndex: number): void
  /**
   * Replaces the value at `index` without reordering anything. For an object-shaped item
   * (a group), writes `value`'s fields into each descendant field; for a scalar item, sets
   * the single field's value directly. A no-op if `index` is out of range.
   */
  updateArrayItem(path: string, index: number, value: unknown): void
  /**
   * Replaces the whole array's current items with `items`, resizing (respecting
   * `minItems`/`maxItems`) and seeding each new value the same way as `updateArrayItem`.
   */
  replaceArray(path: string, items: unknown[]): void
  /** Validates every field and group in the schema; updates and returns overall `isValid`. */
  validateAll(): Promise<boolean>
  /**
   * Builds a submit handler: marks `submitAttempted`, runs `validateAll`, then calls
   * `onValid` with the reconstructed nested `values` if valid, or `onInvalid` with the
   * current state otherwise. Mirrors the `update:modelValue` / `errors` emit pattern from
   * the original `Form.vue`, but validator-agnostic.
   */
  handleSubmit(
    onValid: (values: Record<string, unknown>) => void,
    onInvalid?: (state: FormState) => void,
  ): () => Promise<void>
  /** Resets every field to `values` (or its initial value), clearing errors/touched/dirty. */
  resetForm(values?: Record<string, unknown>): void
  /** Overwrites field values without resetting touched/errors, for programmatic prefill. */
  setValues(values: Record<string, unknown>): void
  /**
   * The current value of every field, reconstructed into the same nested shape as
   * `initialValues` (real arrays for array fields, nested objects for groups), never the
   * engine's internal dotted-path keys.
   */
  values: Record<string, unknown>
  /**
   * The same nested shape as `values`, but containing only fields whose `FieldState.dirty`
   * is `true`: fields the user has actually changed from their initial value. Useful for
   * partial-update submits (e.g. a PATCH that shouldn't overwrite untouched fields).
   */
  dirtyValues: Record<string, unknown>
}
