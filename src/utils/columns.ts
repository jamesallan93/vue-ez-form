/**
 * Evenly distributes the 12-column grid among `count` siblings, so a group's children
 * get a sensible default width when they don't set their own `columns`. 12 (full width)
 * when there are no siblings to distribute among.
 */
export function distributeColumns(count: number): number {
  return count > 0 ? 12 / count : 12
}
