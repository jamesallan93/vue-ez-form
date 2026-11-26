# Layout (columns)

EzForm has an opinion about the *math* of a 12-column grid, and zero opinion about the
*CSS* that realizes it.

## The number

Every `InputFieldEntry` or `GroupFieldEntry` can set `columns`:

```ts
columns?: number | { container?: number; label?: number; wrapper?: number }
```

A plain number sets the field's own width out of 12. The object form additionally hints
at how much of that width should go to the label versus the input itself. Your
component decides what to do with any of it.

## Auto-distribution

A group's children that don't set their own `columns` get an even split computed from
how many siblings there are:

```ts
function distributeColumns(count: number): number {
  return count > 0 ? 12 / count : 12
}
```

Two children → 6 each. Three children → 4 each. A child's own explicit `columns` always
wins over this computed default.

```ts
{
  class: 'grid grid-cols-12 gap-4', // the actual CSS Grid wrapper is yours, see below
  fields: {
    firstName: { type: 'text', name: 'firstName' },  // columns: 6 (auto)
    lastName: { type: 'text', name: 'lastName' },    // columns: 6 (auto)
  },
}
```

## Your component turns the number into CSS

`Form.vue` renders no grid wrapper and generates no `col-span-N` class. That's
deliberate (see [Bring your own components](/guide/components.md)). Two real options,
both equally valid:

**A `class` on the group plus a `columns`-aware component**: the group entry's own `class`
supplies the actual `grid grid-cols-12 gap-4` wrapper, and each child component turns
its received `columns` number into a `grid-column` style or a Tailwind class:

```ts
// a small composable, reusable across every input component
function useColumnSpan(columns: () => number | undefined) {
  return computed(() => {
    const n = columns()
    return n ? { gridColumn: `span ${n} / span ${n}` } : undefined
  })
}
```

```vue
<Field :style="useColumnSpan(() => props.columns).value">
  <!-- ... -->
</Field>
```

Inline styles sidestep needing a Tailwind-class safelist for dynamically-built
`col-span-${n}` strings, which Tailwind's JIT scanner can't see at build time.

**Or skip grids entirely.** If your design doesn't use a 12-column model, ignore
`columns` in your components and lay fields out however you want (flex, stacked, cards).
Nothing in EzForm requires you to use the number.
