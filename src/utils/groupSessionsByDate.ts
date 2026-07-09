import type { Session } from 'src/types/session'

/** One conference day's worth of sessions, in start-time order. */
export interface SessionDayGroup {
  /** The grouping key — the UTC calendar date (`YYYY-MM-DD`) sliced from `Session.date`. */
  date: string
  sessions: Session[]
}

/**
 * Groups sessions by day and sorts both the days and each day's sessions by
 * start time. The grouping key is the raw UTC calendar date — no time-zone
 * conversion here (see journal 03): display-time conversion to the event's
 * fixed Asia/Taipei time zone happens only in `formatSessionTimeRange`, kept
 * separate from this pure grouping step.
 * @param sessions - The full, ungrouped session list.
 * @returns One entry per day, sessions sorted within each day; empty input gives `[]`.
 */
export function groupSessionsByDate(sessions: Session[]): SessionDayGroup[] {
  const byDate = new Map<string, Session[]>()

  for (const session of sessions) {
    const day = session.date.slice(0, 10)
    const existing = byDate.get(day)
    if (existing) {
      existing.push(session)
    } else {
      byDate.set(day, [session])
    }
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySessions]) => ({
      date,
      sessions: [...daySessions].sort((a, b) => a.date.localeCompare(b.date)),
    }))
}
