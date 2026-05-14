const TORONTO_TZ = 'America/Toronto'

/** JS weekday 0=Sunday … 6=Saturday, in Toronto */
export function getTorontoWeekdayNow(): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TORONTO_TZ,
    weekday: 'short',
  })
  const parts = formatter.formatToParts(new Date())
  const w = parts.find((p) => p.type === 'weekday')?.value
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return w != null && w in map ? map[w] : new Date().getDay()
}

/** Monday-first labels aligned with Date.getDay() indices */
export const WEEKDAY_LABELS: { day: number; short: string; long: string }[] = [
  { day: 1, short: 'Mon', long: 'Monday' },
  { day: 2, short: 'Tues', long: 'Tuesday' },
  { day: 3, short: 'Wed', long: 'Wednesday' },
  { day: 4, short: 'Thurs', long: 'Thursday' },
  { day: 5, short: 'Fri', long: 'Friday' },
  { day: 6, short: 'Sat', long: 'Saturday' },
  { day: 0, short: 'Sun', long: 'Sunday' },
]

/** Calendar date in Toronto as YYYYMMDD for simple comparisons */
export function getTorontoTodayYmd(now = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TORONTO_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(now)
  const n = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10)
  const y = n('year')
  const m = n('month')
  const d = n('day')
  return y * 10000 + m * 100 + d
}
