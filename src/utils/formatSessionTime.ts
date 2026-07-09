const VENUE_TIME_ZONE = 'Asia/Taipei'

const sessionTimeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: VENUE_TIME_ZONE,
})

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

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
 * Formats a `groupSessionsByDate` day key (`YYYY-MM-DD`) for display, e.g.
 * "Nov 15". No time-zone conversion needed — the key has no time-of-day
 * component to convert, unlike session start/end times.
 * @param dateKey - A day group's `date`, as produced by `groupSessionsByDate`.
 * @returns e.g. "Nov 15".
 */
export function formatSessionDate(dateKey: string): string {
  const [, month, day] = dateKey.split('-')
  return `${MONTH_LABELS[Number(month) - 1]} ${Number(day)}`
}
