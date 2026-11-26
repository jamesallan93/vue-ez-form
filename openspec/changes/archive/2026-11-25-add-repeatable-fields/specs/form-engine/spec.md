## MODIFIED Requirements

### Requirement: Per-field state is tracked internally, not delegated
For every `InputFieldEntry` in the schema, including each instantiated item of an
`ArrayFieldEntry`, the engine SHALL hold a `FieldState` (`value`, `errors`, `touched`, `dirty`,
`validating`), seeded from `initialValues` at setup or created on demand when an array item is
added at runtime.

#### Scenario: Seeding from initial values
- **WHEN** `useFormEngine(schema, { initialValues: { email: 'a@b.com' } })` is called
- **THEN** `state.fields.email.value` is `'a@b.com'` immediately, before any validation runs

#### Scenario: Adding an array item creates its field state
- **WHEN** `addArrayItem('specialties')` is called on a schema with an `ArrayFieldEntry` named `specialties`
- **THEN** a new `FieldState` (or set of them, if `items` is a group) is registered under an
  indexed key (e.g. `specialties.0.title`), seeded with no value

## ADDED Requirements

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

### Requirement: Whole-array validation is distinct from per-item validation
An `ArrayFieldEntry.validate` SHALL run against the array's whole current value (all items
collected), separately from each item's own `validate` (inherited from the `items` template),
and SHALL surface as an array-level error analogous to `groupErrors`.

#### Scenario: At-least-one-item rule
- **WHEN** an array's `validate` checks `values.length > 0` and the array is currently empty
- **THEN** an array-level error appears, independent of any individual item's validity
