const VENUE_TIME_ZONE = 'Asia/Taipei'

const sessionTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: VENUE_TIME_ZONE,
})

const sessionDateFormatFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: VENUE_TIME_ZONE,
})

/**
 * Formats a session's UTC start/end timestamps as a local time range, fixed
 * to the venue's Asia/Taipei time zone regardless of the viewer's own time
 * zone — grouping/conflict logic stays in raw UTC (see journal 03); this is
 * the one place that converts a session's time-of-day for display.
 * @param startIso - UTC ISO start timestamp (`Session.date`).
 * @param endIso - UTC ISO end timestamp (`Session.endDate`).
 * @returns e.g. "5:00 PM – 6:00 PM (TPE)".
 */
export function formatSessionTimeRange(startIso: string, endIso: string): string {
  const start = sessionTimeFormatter.format(new Date(startIso))
  const end = sessionTimeFormatter.format(new Date(endIso))
  return `${start} – ${end}`
}

/**
 * Formats a date for display, fixed to the venue's Asia/Taipei time zone
 * like `formatSessionTimeRange`. Accepts either a `groupSessionsByDate` day
 * key (`YYYY-MM-DD` — parsed as UTC midnight, which is still the same
 * calendar day once shifted to Taipei for every date in this dataset) or a
 * full UTC ISO timestamp (e.g. a workshop's `date`/`endDate`).
 * @param dateOrKey - A day group's `date`, or a full UTC ISO timestamp.
 * @returns e.g. "Nov 15".
 */
export function formatSessionDate(dateOrKey: string): string {
  return sessionDateFormatFormatter.format(new Date(dateOrKey))
}
