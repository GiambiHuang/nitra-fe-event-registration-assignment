import { ref, shallowReadonly } from 'vue'

export type AsyncResource<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: T }

/**
 * Builds a `useX()` composable around a single module-scoped fetch cache —
 * the shared shape behind `useEventInfo`/`useSessions`: a discriminated-union
 * resource (never independent loading/error/data flags — see `WizardStepper`'s
 * `StepStatus` for why that additive approach is the one to avoid), fetch
 * de-duplication, a `refetch` action, and stale-while-revalidate (old data
 * keeps showing while a background refetch runs, rather than blanking the UI).
 * @param fetcher - Performs the actual fetch (today: reads a mock; async so a
 *   real API swap only touches the `services/` layer this calls into).
 * @returns A `useResource(maxAgeMs?)` function — call it once per resource
 *   type and export the result (see `useEventInfo`), don't call `fetcher`
 *   fresh per component.
 */
export function createAsyncResource<T>(fetcher: () => Promise<T>) {
  const resource = ref<AsyncResource<T>>({ status: 'loading' })
  let fetchedAt: number | null = null
  let inFlight: Promise<void> | null = null

  function fetchResource(): Promise<void> {
    if (inFlight) return inFlight
    // Only drop to a loading state if there's no data to show yet — a
    // background refetch of already-fresh-enough data shouldn't blank the UI.
    if (resource.value.status !== 'success') {
      resource.value = { status: 'loading' }
    }
    inFlight = fetcher()
      .then(data => {
        resource.value = { status: 'success', data }
        fetchedAt = Date.now()
      })
      .catch(error => {
        // A failed background refetch shouldn't clobber data that was
        // already showing successfully — only surface the error if there's
        // nothing else to show.
        if (resource.value.status !== 'success') {
          resource.value = { status: 'error', error }
        }
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }

  /**
   * @param maxAgeMs - How long cached data stays fresh before this call
   *   triggers a background refetch. `Infinity` (default) means data is
   *   never considered stale on its own; pass a real number once the
   *   resource is backed by something that can actually change server-side.
   * @returns The read-only resource ref, plus a `refetch` action to force a reload.
   */
  return function useResource(maxAgeMs = Infinity) {
    const isStale = fetchedAt === null || Date.now() - fetchedAt > maxAgeMs
    if (isStale) fetchResource()

    return {
      // shallowReadonly, not readonly: this only needs to block reassigning
      // `resource.value` from outside `fetchResource`/`refetch` (the actual
      // risk — a consumer accidentally swapping the cached data). Deep
      // `readonly()` would also mark nested arrays inside `T` as read-only,
      // which isn't assignable to the plain domain types (e.g. `TicketType`,
      // `Session`) that child component props are typed against.
      resource: shallowReadonly(resource),
      refetch: fetchResource,
    }
  }
}
