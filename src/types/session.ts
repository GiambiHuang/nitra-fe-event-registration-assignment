/** The conference tracks used in `src/mocks/sessions.js`. */
export type SessionTrack = 'main' | 'frontend' | 'backend' | 'devops'

/**
 * A conference talk, as defined in `src/mocks/sessions.js`.
 * `date`/`endDate` are UTC ISO timestamps — grouping/conflict logic must
 * compare them as UTC, not the viewer's local time zone (see journal 03).
 */
export interface Session {
  id: string
  title: string
  speaker: string
  speakerTitle: string
  track: SessionTrack
  /** UTC ISO start timestamp. */
  date: string
  /** UTC ISO end timestamp. */
  endDate: string
  capacity: number
  registered: number
  description: string
}
