## ADDED Requirements

### Requirement: Dirty-only values are available for submission
`FormEngine` SHALL expose a `dirtyValues` property, computed from only the fields whose
`FieldState.dirty` is `true`, alongside the existing full `values`.

#### Scenario: Partial update request
- **WHEN** a form has 5 fields and the user has only changed 2 of them
- **THEN** `dirtyValues` contains only those 2 fields' current values, while `values` still
  contains all 5
