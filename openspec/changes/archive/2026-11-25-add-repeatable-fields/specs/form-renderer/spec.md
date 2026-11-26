## ADDED Requirements

### Requirement: Array entries render their items template repeatedly
`Form.vue` SHALL render an `ArrayFieldEntry` by instantiating its `items` template once per
current array length, passing each instance the index-qualified field key, and SHALL expose
add/remove operations to the consumer.

#### Scenario: Rendering a list of object items
- **WHEN** an `ArrayFieldEntry` named `specialties` currently has 2 items
- **THEN** `Form.vue` renders the `items` group twice, once bound to `specialties.0.*` keys and
  once to `specialties.1.*` keys

#### Scenario: Add/remove controls reach the consumer
- **WHEN** a consumer needs to render "Add" / "Remove" buttons for an array field
- **THEN** `Form.vue` exposes the engine's add/remove operations for that array (e.g. via the
  per-field named slot already used for single-field override)
