import type { Mic } from './normalize'
import { getTorontoTodayYmd } from './torontoTime'

export interface CategorizedMics {
  /** Weekly / recurring + same-day one-offs (shown under “Today’s {weekday} mics” or “{weekday} mics”) */
  weeklyMics: Mic[]
  /** Dated one-offs with at least one upcoming date */
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

const MONTH_DAY_ANCHOR_RE =
  /\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sep|sept|october|oct|november|nov|december|dec)\s+(\d{1,2})(?:st|nd|rd|th)?\b/gi

const TRAILING_DAY_ONLY_RE = /^\s*,\s*(\d{1,2})(?:st|nd|rd|th)?/

type MonthDay = { month: number; day: number }

function monthDayKey(md: MonthDay): string {
  return `${md.month}-${md.day}`
}

/** All month/day pairs in text, including "May 11, 25" → May 11 & May 25. */
export function parseAllMonthDaysFromText(text: string): MonthDay[] {
  const seen = new Set<string>()
  const results: MonthDay[] = []

  const add = (month: number, day: number) => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return
    const key = monthDayKey({ month, day })
    if (seen.has(key)) return
    seen.add(key)
    results.push({ month, day })
  }

  const scan = (fragment: string) => {
    MONTH_DAY_ANCHOR_RE.lastIndex = 0
    let match: RegExpExecArray | null
    while ((match = MONTH_DAY_ANCHOR_RE.exec(fragment)) !== null) {
      const month = MONTH_WORD[match[1].toLowerCase()]
      const day = parseInt(match[2], 10)
      if (!month) continue
      add(month, day)

      let pos = match.index + match[0].length
      let tail = fragment.slice(pos)
      let trailing = TRAILING_DAY_ONLY_RE.exec(tail)
      while (trailing) {
        add(month, parseInt(trailing[1], 10))
        pos += trailing[0].length
        tail = fragment.slice(pos)
        trailing = TRAILING_DAY_ONLY_RE.exec(tail)
      }
    }

    const slash = fragment.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/)
    if (slash) {
      const a = parseInt(slash[1], 10)
      const b = parseInt(slash[2], 10)
      if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
        add(a, b)
      }
    }
  }

  const lower = text.toLowerCase()
  const parenRe = /\(([^)]+)\)/g
  let paren: RegExpExecArray | null
  let foundParen = false
  while ((paren = parenRe.exec(lower)) !== null) {
    foundParen = true
    scan(paren[1])
  }
  if (!foundParen) {
    scan(lower)
  } else {
    scan(lower)
  }

  return results
}

/** @deprecated Use parseAllMonthDaysFromText — returns first match only. */
export function parseMonthDayFromText(text: string): MonthDay | null {
  return parseAllMonthDaysFromText(text)[0] ?? null
}

function ymdFromParts(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d
}

/** Sheet dates are treated as occurring in the calendar year of `todayYmd`. */
function resolveEventYmdInSheetYear(
  month: number,
  day: number,
  todayYmd: number,
): number | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const y = Math.floor(todayYmd / 10000)
  return ymdFromParts(y, month, day)
}

/** All event dates for a mic in the sheet year, sorted ascending. */
export function parseMicEventYmds(mic: Mic, todayYmd: number): number[] {
  const blob = `${mic.frequencyRaw}\n${mic.extraNotes}`
  const mds = parseAllMonthDaysFromText(blob)
  const ymds = mds
    .map((md) => resolveEventYmdInSheetYear(md.month, md.day, todayYmd))
    .filter((ymd): ymd is number => ymd != null)
  return [...new Set(ymds)].sort((a, b) => a - b)
}

/** Next upcoming date on or after today, else the latest parsed date. */
export function parseMicEventYmd(mic: Mic, todayYmd: number): number | null {
  const ymds = parseMicEventYmds(mic, todayYmd)
  if (ymds.length === 0) return null
  const upcoming = ymds.filter((y) => y >= todayYmd)
  if (upcoming.length > 0) return upcoming[0]
  return ymds[ymds.length - 1]
}

function formatYmdLabel(ymd: number): string {
  const m = Math.floor((ymd % 10000) / 100)
  const d = ymd % 100
  const mon = MONTH_NAMES[m] ?? ''
  if (!mon) return ''
  return `${mon} ${d}`
}

function formatYmdList(ymds: number[]): string | null {
  if (ymds.length === 0) return null
  const labels = ymds.map(formatYmdLabel).filter(Boolean)
  if (labels.length === 0) return null
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} & ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} & ${labels[labels.length - 1]}`
}

/** Short label like "May 11" or "May 11 & 25" for titles. */
export function formatMicEventDateLabel(
  mic: Mic,
  todayYmd: number,
  eventYmd?: number,
): string | null {
  if (eventYmd != null) {
    return formatYmdLabel(eventYmd) || null
  }

  const ymds = parseMicEventYmds(mic, todayYmd)
  const upcoming = ymds.filter((y) => y >= todayYmd)
  if (upcoming.length > 0) {
    return formatYmdList(upcoming)
  }
  if (ymds.length > 0) {
    return formatYmdList([ymds[ymds.length - 1]])
  }
  return null
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

    const ymds = parseMicEventYmds(mic, todayYmd)
    if (ymds.length === 0) {
      weeklyMics.push(mic)
      continue
    }

    const upcoming = ymds.filter((y) => y >= todayYmd)
    if (upcoming.length === 0) {
      weeklyMics.push(mic)
      continue
    }

    futureMics.push(mic)
  }

  weeklyMics.sort(sortByTime)
  futureMics.sort((a, b) => sortFutureByDate(a, b, todayYmd))

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

  if (parseAllMonthDaysFromText(lower).length > 0 && !isLikelyRecurringDespiteDate(lower)) {
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

function sortFutureByDate(a: Mic, b: Mic, todayYmd: number): number {
  const ya = parseMicEventYmd(a, todayYmd) ?? 0
  const yb = parseMicEventYmd(b, todayYmd) ?? 0
  if (ya !== yb) return ya - yb
  return sortByTime(a, b)
}
