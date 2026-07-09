import { event } from 'src/mocks/event.js'
import type { EventInfo } from 'src/types/event'

/**
 * Fetches the conference's static metadata: name, dates, venue, and ticket
 * types. Backed by local mock data today; `async` so that swapping to a real
 * API later only means changing this function's body — every caller already
 * awaits a `Promise` and can handle rejection.
 * @returns The conference's event info.
 */
export async function getEventInfo(): Promise<EventInfo> {
  return event
}
