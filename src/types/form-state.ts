import type { FieldState } from './field-state'

/**
 * The engine's form-wide state: one `FieldState` per field plus the orchestration flags
 * that no validation library tracks (submission, in-flight status, overall validity).
 * Built and owned entirely by EzForm's engine. The user's validator only ever answers
 * "is this value valid," never holds state itself.
 */
export interface FormState {
  /**
   * Per-field state, keyed by the field's full dotted path from the schema root (e.g. a
   * top-level field is just its own name; a field nested in a group is `groupName.fieldName`;
   * a field inside an array item is `arrayName.0.fieldName`). Groups contribute their own key
   * as a path segment, so a group's values end up nested under its key in `values`/
   * `dirtyValues`, matching the group's own role as a sub-object.
   */
  fields: Record<string, FieldState>
  /**
   * Group-level validation errors: issues from a group's `validate` that carried no `path`,
   * so they can't be attributed to a single child field. Keyed by the group's own full path.
   */
  groupErrors: Record<string, string[]>
  /**
   * The current number of items in each array field, keyed by the array's full path. Drives
   * how many times the renderer repeats `items`.
   */
  arrayLengths: Record<string, number>
  /**
   * Array-level validation errors: issues from an `ArrayFieldEntry.validate` run against the
   * array's whole value, analogous to `groupErrors`. Keyed by the array's full path.
   */
  arrayErrors: Record<string, string[]>
  /**
   * Whether submit has been attempted at least once. Drives showing a field's error even
   * when it hasn't been touched, matching standard form-library behavior.
   */
  submitAttempted: boolean
  /** Whether the form's submit flow (validation, then the consumer's submit handler) is running. */
  isSubmitting: boolean
  /** Whether every field and group currently has no errors. */
  isValid: boolean
}
