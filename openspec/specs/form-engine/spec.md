## Purpose

The runtime engine (`src/composables/useFormEngine.ts`) that builds and owns a form's live
state from a `FormSchema`: value/error/touched/dirty tracking per field, group-level cross-
field validation, and the submit lifecycle. The user's validation library is called as a pure
function here — it never holds state itself; EzForm's engine does.

## Requirements

### Requirement: Per-field state is tracked internally, not delegated
For every `InputFieldEntry` in the schema, including each instantiated item of an
`ArrayFieldEntry`, the engine SHALL hold a `FieldState` (`value`, `errors`, `touched`, `dirty`,
`validating`), seeded from `initialValues` at setup or created on demand when an array item is
added at runtime.

#### Scenario: Seeding from initial values
- **WHEN** `useFormEngine(schema, { initialValues: { email: 'a@b.com' } })` is called
- **THEN** `state.fields.email.value` is `'a@b.com'` immediately, before any validation runs

#### Scenario: Seeding falls back to schema-level or field-level defaults
- **WHEN** no `initialValues` entry exists for a field, but `schema.defaultValues` or that
  field's own `InputFieldEntry.defaultValue` does (see the field-schema spec's "Default
  values" requirement for the full precedence)
- **THEN** `state.fields[name].value` seeds from whichever of those applies, not `undefined`

#### Scenario: resetForm() follows the same default precedence
- **WHEN** `resetForm()` is called (no argument) and a field has no `initialValues` entry but
  does have a `schema.defaultValues` or `InputFieldEntry.defaultValue` entry
- **THEN** that field resets to the same value it would have been seeded with at setup, not
  `undefined`

#### Scenario: Dirty tracking uses the resolved seed, not raw initialValues
- **WHEN** a field has no `initialValues` entry but does have a `schema.defaultValues` or
  `InputFieldEntry.defaultValue` entry, and the user's edit leaves its value equal to that
  resolved default
- **THEN** `FieldState.dirty` is `false` — comparison is against the resolved seed value, not
  against `undefined`

#### Scenario: Adding an array item creates its field state
- **WHEN** `addArrayItem('specialties')` is called on a schema with an `ArrayFieldEntry` named `specialties`
- **THEN** a new `FieldState` (or set of them, if `items` is a group) is registered under an
  indexed key (e.g. `specialties.0.title`), seeded with no value

### Requirement: Field keys are the full dotted path from the schema root
Every field's key in `state.fields` (and a group's key in `state.groupErrors`) SHALL be its
full dotted path from the schema root — a top-level field is its own name, a field nested in
a group is `groupName.fieldName`, and a field inside an array item is `arrayName.0.fieldName`.
There is no special "flat" case for ordinary groups; a group always contributes its own key as
a path segment, so its values end up nested under that key in `values`/`dirtyValues`.

#### Scenario: A plain group nests its values
- **WHEN** a schema has a top-level group named `address` containing a `city` field
- **THEN** `state.fields['address.city']` holds that field's state, and `values.address.city`
  holds its value — not a flat top-level `values.city`

### Requirement: Errors display on touch or submit, not immediately
A field's error SHALL only surface (via `getFieldBinding`'s derived `error`) once that field
has been touched (blurred) OR the form has had at least one submit attempt.

#### Scenario: Freshly rendered, untouched field
- **WHEN** the form has just been rendered and the user has not interacted with a field
- **THEN** `getFieldBinding(name).error` is `undefined`, even if the field is currently invalid

#### Scenario: Submit attempted without touching anything
- **WHEN** `handleSubmit`'s returned function is called
- **THEN** `state.submitAttempted` becomes `true` and every invalid field's error becomes visible

### Requirement: Validators run in order, first failure wins
For a field or group with multiple validators (`FieldValidator[]`), the engine SHALL run them
in array order and stop at the first validator that reports issues.

#### Scenario: Chained validators
- **WHEN** a field has `validate: [requiredCheck, formatCheck]` and the value fails `requiredCheck`
- **THEN** `formatCheck` never runs, and only `requiredCheck`'s message appears in `errors`

### Requirement: Group validation refreshes children before layering cross-field errors
`validateGroup` SHALL first re-run each direct child's own validation (so prior group-
contributed errors don't linger), then run the group's own validator and attribute each
resulting issue to the child named by `path[0]`, or to `state.groupErrors[name]` if the issue
has no `path`.

#### Scenario: Repeated group validation doesn't accumulate stale errors
- **WHEN** `validateGroup(name)` is called twice in a row, and the second call's cross-field
  check passes
- **THEN** no error from the first call remains on any child field

#### Scenario: A nested group child carries its real value into the parent's cross-field check
- **WHEN** a group's child is itself a `GroupFieldEntry` (e.g. `address` nested inside
  `shipping`)
- **THEN** the parent group's own `validate` receives that child's actual reconstructed
  value (an object of its own fields) under its key, not `undefined`

### Requirement: Submission validates everything before calling the consumer
`handleSubmit(onValid, onInvalid)` SHALL return a function that: marks `submitAttempted`,
runs `validateAll()` across every field and group, then calls `onValid(values)` if the form
is valid or `onInvalid(state)` otherwise.

#### Scenario: Submitting a valid form
- **WHEN** every field and group passes validation and the returned submit function is called
- **THEN** `onValid` is called with the reconstructed `values` object, and `onInvalid` is not called

#### Scenario: Submitting an invalid form
- **WHEN** at least one field or group fails validation and the returned submit function is called
- **THEN** `onInvalid` is called with the current `FormState`, and `onValid` is not called

### Requirement: Validators are called as pure functions, never hold state
The engine SHALL be the only code that calls a field's or group's `validate`. It SHALL treat
Standard Schema objects and plain functions identically (normalizing both to the same issue
shape) and SHALL await async validators correctly.

#### Scenario: Async Standard Schema validator
- **WHEN** a field's validator's `~standard.validate` returns a `Promise`
- **THEN** `field.validating` is `true` until that promise resolves, then `false`

### Requirement: Reset and programmatic value changes are supported
`resetForm(values?)` SHALL restore every field to `values` (or its initial value) and clear
all errors/touched/dirty/submitAttempted state. `setValues(values)` SHALL overwrite field
values without resetting touched/errors, for silent programmatic prefill.

#### Scenario: Resetting after a failed submit
- **WHEN** `resetForm()` is called after a submit attempt left `submitAttempted: true`
- **THEN** `submitAttempted` becomes `false` and no field shows an error, even if untouched

### Requirement: Dirty-only values are available for submission
`FormEngine` SHALL expose a `dirtyValues` property, computed from only the fields whose
`FieldState.dirty` is `true`, alongside the existing full `values`.

#### Scenario: Partial update request
- **WHEN** a form has 5 fields and the user has only changed 2 of them
- **THEN** `dirtyValues` contains only those 2 fields' current values, while `values` still
  contains all 5

### Requirement: Array items can be added and removed at runtime
The engine SHALL expose operations to add a new item (instantiating `items` under the next
index) and remove an item by index, both respecting `minItems`/`maxItems` on the
`ArrayFieldEntry`.

#### Scenario: Removing below the minimum is rejected
- **WHEN** an `ArrayFieldEntry` has `minItems: 1` and only one item remains
- **THEN** calling remove on that last item is a no-op; the item is not removed

#### Scenario: Adding above the maximum is rejected
- **WHEN** an `ArrayFieldEntry` has `maxItems: 5` and five items already exist
- **THEN** calling add is a no-op; no sixth item is created

### Requirement: Array items support insert, swap, move, update, and whole-array replace
Beyond append (`addArrayItem`) and remove (`removeArrayItem`), the engine SHALL expose
`insertArrayItem` (insert at an index, shifting later items up), `prependArrayItem`
(insert at index 0), `swapArrayItems` (swap two items' entire state), `moveArrayItem`
(move an item to a new index, shifting the items in between), `updateArrayItem` (replace
one item's value without reordering), and `replaceArray` (replace the whole array's
items, resizing as needed). `addArrayItem` and `insertArrayItem`/`prependArrayItem` MAY
be given a value to seed the new item with, instead of always seeding `undefined`.

#### Scenario: Inserting at an index shifts later items up
- **WHEN** an array has items `[a, b, c]` and `insertArrayItem(path, 1, 'x')` is called
- **THEN** the array becomes `[a, x, b, c]`. `b` and `c` each keep their own validation
  state (errors, touched, dirty), just moved to their new index

#### Scenario: Inserting out of range is rejected
- **WHEN** an array has 3 items and `insertArrayItem` is called with an index less than 0
  or greater than 3
- **THEN** the call is a no-op

#### Scenario: Swapping preserves each item's own state
- **WHEN** `swapArrayItems(path, 0, 2)` is called on items `[a, b, c]`, and item `a` has a
  validation error that `c` does not
- **THEN** the array becomes `[c, b, a]`, and the error that was on index 0 is now on
  index 2, following its item

#### Scenario: Moving shifts only the items in between
- **WHEN** `moveArrayItem(path, 3, 0)` is called on items `[a, b, c, d]`
- **THEN** the array becomes `[d, a, b, c]`

#### Scenario: Updating an object-shaped item writes into its descendant fields
- **WHEN** an array's `items` is a group with `title`/`duration` fields, and
  `updateArrayItem(path, 0, { title: 'Vue', duration: '3' })` is called
- **THEN** that item's `title` and `duration` fields are each set from the given object,
  without touching any other item or changing the array's length

#### Scenario: Replacing resizes and reseeds every item
- **WHEN** `replaceArray(path, items)` is called with a `items.length` different from the
  array's current length
- **THEN** the array is resized to `items.length` (respecting `minItems`/`maxItems`, same
  as `addArrayItem`/`removeArrayItem`) and every item's value is set from `items`

### Requirement: Whole-array validation is distinct from per-item validation
An `ArrayFieldEntry.validate` SHALL run against the array's whole current value (all items
collected), separately from each item's own `validate` (inherited from the `items` template),
and SHALL surface as an array-level error analogous to `groupErrors`.

#### Scenario: At-least-one-item rule
- **WHEN** an array's `validate` checks `values.length > 0` and the array is currently empty
- **THEN** an array-level error appears, independent of any individual item's validity

### Requirement: Arrays nest to arbitrary depth
An `ArrayFieldEntry.items` MAY itself be an `ArrayFieldEntry`. Registration, add/remove with
reindexing, and validation (both per-item and whole-array) SHALL all work identically at any
nesting depth, since the engine never special-cases depth — a nested array is registered
under its parent item's own path and recurses through the same operations.

#### Scenario: Adding a new row seeds its own nested array per its own minItems
- **WHEN** `addArrayItem('matrix')` is called and `matrix`'s `items` is itself an array with
  `minItems: 1`
- **THEN** the new row (e.g. `matrix.2`) is seeded with 1 empty cell already registered (e.g.
  `matrix.2.0`), not zero — the nested array respects its own template's `minItems`, not the
  outer array's

#### Scenario: Removing an outer item reindexes nested state correctly
- **WHEN** `removeArrayItem('matrix', 0)` is called and remaining rows each contain their own
  nested cells (e.g. `matrix.1.0`, `matrix.2.0`, `matrix.2.1`)
- **THEN** every nested key shifts down consistently (`matrix.1.*` becomes `matrix.0.*`,
  `matrix.2.*` becomes `matrix.1.*`), with no stale or duplicated keys left behind

#### Scenario: Validation errors attribute to the correct nesting level
- **WHEN** a nested array's own `validate` fails for one row, while the outer array's `validate`
  (checking only the outer length) passes
- **THEN** `state.arrayErrors` holds the row's error under that row's own path (e.g.
  `matrix.0`), and the outer array's error list stays empty
