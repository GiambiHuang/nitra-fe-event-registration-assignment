import { ref, shallowReadonly } from 'vue'
import { getEventInfo } from 'src/services'
import type { EventInfo } from 'src/types/event'

type EventInfoResource =
  | { status: 'loading' }
  | { status: 'error'; error: unknown }
  | { status: 'success'; data: EventInfo }

const resource = ref<EventInfoResource>({ status: 'loading' })
let fetchedAt: number | null = null
let inFlight: Promise<void> | null = null

/**
 * Runs the actual fetch. Concurrent callers (e.g. a manual `refetch()` while
 * a staleness-triggered fetch is already running) share the same in-flight
 * promise instead of firing a second request.
 */
function fetchEventInfo(): Promise<void> {
  if (inFlight) return inFlight
  // Only drop to a loading state if there's no data to show yet — a
  // background refetch of already-fresh-enough data shouldn't blank the UI.
  if (resource.value.status !== 'success') {
    resource.value = { status: 'loading' }
  }
  inFlight = getEventInfo()
    .then(data => {
      resource.value = { status: 'success', data }
      fetchedAt = Date.now()
    })
    .catch(error => {
      // A failed background refetch shouldn't clobber data that was already
      // showing successfully — only surface the error if there's nothing else to show.
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
 * Fetches and caches the conference's static metadata (event info + ticket
 * types), shared across every caller (Step 1, Step 3's VIP check, Step 4's
 * review) via one module-scoped cache.
 * @param maxAgeMs - How long cached data stays fresh before this call
 *   triggers a background refetch (stale-while-revalidate — old data keeps
 *   showing while the refetch runs). `Infinity` (default) means data is
 *   never considered stale on its own; appropriate while this is static mock
 *   data. Pass a real number once it's backed by something that can
 *   actually change server-side.
 * @returns The read-only resource ref, plus a `refetch` action to force a reload.
 */
export function useEventInfo(maxAgeMs = Infinity) {
  const isStale = fetchedAt === null || Date.now() - fetchedAt > maxAgeMs
  if (isStale) fetchEventInfo()

  return {
    // shallowReadonly, not readonly: this only needs to block reassigning
    // `resource.value` from outside `fetchEventInfo`/`refetch` (the actual
    // risk — a consumer accidentally swapping the cached data). Deep
    // `readonly()` would also mark nested arrays (e.g. `TicketType.perks`)
    // as `readonly string[]`, which isn't assignable to plain domain types
    // like `TicketType` that child component props are typed against —
    // fetched reference data has no per-field setters to protect anyway.
    resource: shallowReadonly(resource),
    refetch: fetchEventInfo,
  }
}
