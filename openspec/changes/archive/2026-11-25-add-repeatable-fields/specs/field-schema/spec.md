## ADDED Requirements

### Requirement: Array entries describe a repeatable list
An `ArrayFieldEntry` (`type: 'array'`) SHALL carry an `items` template (itself any
`FieldEntry`, enabling object-shaped items via a group, scalar items via a plain input, or
nested repeated lists), and MAY carry `minItems`/`maxItems` and a whole-array `validate`.

#### Scenario: Object-shaped repeatable items
- **WHEN** an `ArrayFieldEntry.items` is a `GroupFieldEntry` with `title`/`duration` fields
- **THEN** each item in the array is expected to be an object with those two keys
