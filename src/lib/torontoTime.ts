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
  { day: 2, short: 'Tue', long: 'Tuesday' },
  { day: 3, short: 'Wed', long: 'Wednesday' },
  { day: 4, short: 'Thu', long: 'Thursday' },
  { day: 5, short: 'Fri', long: 'Friday' },
  { day: 6, short: 'Sat', long: 'Saturday' },
  { day: 0, short: 'Sun', long: 'Sunday' },
]
