import { sessions } from 'src/mocks/sessions.js'
import type { Session, SessionTrack } from 'src/types/session'

// Plain .js literals widen their string fields to `string` when TypeScript
// infers an export type (no `as const` in the provided mock, and it isn't
// ours to edit). `track` is the only field where that widening actually
// matters — narrowing just that field here means every other field is still
// structurally checked against `Session` on every build, instead of trusting
// the whole shape via a blanket cast.
function toSession(raw: Omit<Session, 'track'> & { track: string }): Session {
  return { ...raw, track: raw.track as SessionTrack }
}

/**
 * Fetches every conference session across both days. Backed by local mock
 * data today; see `eventService.getEventInfo` for why this is `async`.
 * @returns All sessions, ungrouped and unsorted.
 */
export async function getSessions(): Promise<Session[]> {
  return sessions.map(toSession)
}
