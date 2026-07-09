/** Anything with a UTC ISO start/end — `Session`, `WorkshopAddon`. */
interface TimeRange {
  date: string
  endDate: string
}

/**
 * Whether two UTC time ranges overlap. Start-inclusive/end-exclusive — a
 * session ending exactly when another starts doesn't conflict. Compares the
 * raw ISO strings directly (lexicographic order matches chronological order
 * for same-format UTC ISO timestamps), no `Date` parsing needed.
 * @param a - The first time range.
 * @param b - The second time range.
 * @returns Whether `a` and `b` overlap.
 */
export function timeRangesOverlap(a: TimeRange, b: TimeRange): boolean {
  return a.date < b.endDate && b.date < a.endDate
}

/**
 * The ids of items in `candidates` that overlap in time with at least one of
 * `selected` — used for Step 2's visual conflict warning (selection itself
 * stays free per the README; actual blocking validation happens at Step 4
 * submit) and Step 3's workshop conflicts. `candidates`/`selected` can be
 * different types (e.g. workshops checked against selected sessions) as long
 * as both have a stable `id` and a UTC time range — Step 3 also calls this a
 * second time with both args as workshops, for the workshop-vs-workshop
 * check. An item is never considered in conflict with itself.
 * @param candidates - Items to check (must have a stable `id`).
 * @param selected - The items currently selected.
 * @returns The ids of `candidates` entries that conflict with `selected`.
 */
export function findConflictingIds<
  Candidate extends TimeRange & { id: string },
  Selected extends TimeRange & { id: string },
>(candidates: Candidate[], selected: Selected[]): Set<string> {
  const conflicting = new Set<string>()
  for (const candidate of candidates) {
    const conflicts = selected.some(
      other => other.id !== candidate.id && timeRangesOverlap(candidate, other),
    )
    if (conflicts) conflicting.add(candidate.id)
  }
  return conflicting
}
