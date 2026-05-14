import type { Mic } from './normalize'
import { getTorontoTodayYmd } from './torontoTime'

export interface CategorizedMics {
  /** Weekly / recurring mics for this weekday, plus one-offs happening today or undated */
  weeklyMics: Mic[]
  /** Dated one-offs on this weekday whose calendar date is after today (Toronto) */
  futureMics: Mic[]
}

const MONTH_WORD: Record<string, number> = {
  january: 1,
  jan: 1,
  february: 2,
  feb: 2,
  march: 3,
  mar: 3,
  april: 4,
  apr: 4,
  may: 5,
  june: 6,
  jun: 6,
  july: 7,
  jul: 7,
  august: 8,
  aug: 8,
  september: 9,
  sep: 9,
  sept: 9,
  october: 10,
  oct: 10,
  november: 11,
  nov: 11,
  december: 12,
  dec: 12,
}

const MONTH_NAMES = [
  '',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function parseMonthDayFromText(text: string): { month: number; day: number } | null {
  const t = text.toLowerCase()
  const word = t.match(
    /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/,
  )
  if (word) {
    const month = MONTH_WORD[word[1]]
    const day = parseInt(word[2], 10)
    if (month && day >= 1 && day <= 31) return { month, day }
  }
  const slash = t.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
  if (slash) {
    const a = parseInt(slash[1], 10)
    const b = parseInt(slash[2], 10)
    // Prefer M/D when both ≤12 (North American sheets)
    if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
      return { month: a, day: b }
    }
  }
  return null
}

function ymdFromParts(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d
}

/** Pick year so the event is not before `todayYmd` when possible */
function resolveEventYmd(
  month: number,
  day: number,
  todayYmd: number,
): number | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  let y = Math.floor(todayYmd / 10000)
  let ymd = ymdFromParts(y, month, day)
  if (ymd < todayYmd) {
    y += 1
    ymd = ymdFromParts(y, month, day)
  }
  return ymd
}

export function parseMicEventYmd(mic: Mic, todayYmd: number): number | null {
  const blob = `${mic.frequencyRaw}\n${mic.extraNotes}`
  const md = parseMonthDayFromText(blob)
  if (!md) return null
  return resolveEventYmd(md.month, md.day, todayYmd)
}

/** Short label like "May 24" for titles — uses same parse rules as categorization */
export function formatMicEventDateLabel(mic: Mic, todayYmd: number): string | null {
  const blob = `${mic.frequencyRaw}\n${mic.extraNotes}`
  const md = parseMonthDayFromText(blob)
  if (!md) return null
  const ymd = resolveEventYmd(md.month, md.day, todayYmd)
  if (!ymd) return null
  const y = Math.floor(ymd / 10000)
  const m = Math.floor((ymd % 10000) / 100)
  const d = ymd % 100
  const mon = MONTH_NAMES[m] ?? ''
  if (!mon) return null
  return `${mon} ${d}${y !== Math.floor(todayYmd / 10000) ? `, ${y}` : ''}`
}

/**
 * Split mics for a selected weekday into weeklies vs dated future one-offs.
 * Callers should pass rows already filtered to the selected day.
 */
export function categorizeMics(
  mics: Mic[],
  todayYmd: number = getTorontoTodayYmd(),
): CategorizedMics {
  const weeklyMics: Mic[] = []
  const futureMics: Mic[] = []

  for (const mic of mics) {
    if (isRecurringShow(mic)) {
      weeklyMics.push(mic)
      continue
    }

    const eventYmd = parseMicEventYmd(mic, todayYmd)
    if (eventYmd === null) {
      weeklyMics.push(mic)
      continue
    }

    if (eventYmd > todayYmd) {
      futureMics.push(mic)
    } else {
      weeklyMics.push(mic)
    }
  }

  weeklyMics.sort(sortByTime)
  futureMics.sort(sortByTime)

  return { weeklyMics, futureMics }
}

function isRecurringShow(mic: Mic): boolean {
  const lower = `${mic.frequencyRaw} ${mic.extraNotes}`.toLowerCase()

  const oneOffKeywords = [
    'one night',
    'one-time',
    'one time',
    'one off',
    'special event',
    'only on',
    'finale',
    'final show',
  ]
  if (oneOffKeywords.some((k) => lower.includes(k))) {
    if (!/\b(every|weekly|each)\b/.test(lower)) return false
  }

  if (parseMonthDayFromText(lower) && !isLikelyRecurringDespiteDate(lower)) {
    return false
  }

  const recurringKeywords = [
    'every',
    'weekly',
    'each',
    'bi-weekly',
    'biweekly',
    'monthly',
    'recurring',
    'regular',
  ]
  if (recurringKeywords.some((k) => lower.includes(k))) return true

  if (
    /\b(mondays|tuesdays|wednesdays|thursdays|fridays|saturdays|sundays)\b/.test(
      lower,
    )
  ) {
    return true
  }

  if (!mic.frequencyRaw.trim()) return true

  return true
}

/** e.g. "every Monday except May 24" — still recurring */
function isLikelyRecurringDespiteDate(lower: string): boolean {
  return /\b(every|weekly|each)\b/.test(lower)
}

function sortByTime(a: Mic, b: Mic): number {
  const timeA = a.sortMinutes ?? Infinity
  const timeB = b.sortMinutes ?? Infinity
  if (timeA !== timeB) return timeA - timeB
  return a.showName.localeCompare(b.showName)
}
