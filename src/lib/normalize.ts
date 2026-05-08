import type { ColumnKey } from '../config/columnMap'
import type { SheetDayTab } from '../config/sheet'

export type RawSheetRow = Partial<Record<ColumnKey, string>>

export type Mic = {
  id: string
  showName: string
  venueName: string
  venueAddress: string
  frequencyRaw: string
  signUpTime: string
  showtimeRaw: string
  producerName: string
  instagramUrls: string[]
  extraNotes: string
  linkOutUrls: string[]
  status: string
  dataType: string
  regionLabel: string
  /** Weekday from the sheet tab (single day per row) — matches Date.getDay() */
  weekdays: number[]
  /** Human tab name: Monday … Sunday */
  sheetTabDay: string
  sheetTabGid: string
  sortMinutes: number | null
  /** Optional coordinates from sheet columns — skips geocoding when both set */
  sheetLat?: number
  sheetLng?: number
}

/** Pull https:// URLs from free text */
export function extractHttpUrls(text: string): string[] {
  const re = /https?:\/\/[^\s"'<>[\]()]+/gi
  const raw = text.match(re) ?? []
  const cleaned = raw.map((u) => u.replace(/[.,);]+$/, ''))
  return [...new Set(cleaned)]
}

/** Split Instagram cell into handles / URLs → normalized https URLs */
export function parseInstagramCell(cell: string): string[] {
  if (!cell.trim()) return []

  const pieces = cell
    .split(/[\n,]+/g)
    .map((s) => s.trim())
    .filter(Boolean)

  const urls: string[] = []
  for (const piece of pieces) {
    if (/^https?:\/\//i.test(piece)) {
      urls.push(piece)
      continue
    }
    const handle = piece.replace(/^@/, '').replace(/^instagram\.com\//i, '')
    if (handle) urls.push(`https://instagram.com/${handle}`)
  }
  return [...new Set(urls)]
}

/** Minutes since midnight for sorting; null if unparseable */
export function parseShowtimeToMinutes(raw: string): number | null {
  const s = raw.trim().toLowerCase().replace(/^~+/, '')
  if (!s || /^booked|^lotto|^list\b|^n\/a/.test(s)) return null

  const normalized = s.replace(/\s+/g, '')

  let m = normalized.match(/^(\d{1,2}):(\d{2})(am|pm)?$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const min = parseInt(m[2], 10)
    const ap = m[3]?.toLowerCase()
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    if (!ap && h >= 0 && h <= 23) return h * 60 + min
    if (ap) return h * 60 + min
  }

  m = normalized.match(/^(\d{1,2})(am|pm)$/i)
  if (m) {
    let h = parseInt(m[1], 10)
    const ap = m[2].toLowerCase()
    if (ap === 'pm' && h < 12) h += 12
    if (ap === 'am' && h === 12) h = 0
    return h * 60
  }

  m = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (m) {
    const h = parseInt(m[1], 10)
    const min = parseInt(m[2], 10)
    if (h <= 23) return h * 60 + min
  }

  return null
}

function simpleHash(input: string): string {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  }
  return Math.abs(h).toString(36)
}

export function rowToMic(
  row: RawSheetRow,
  regionLabel: string,
  tab: Pick<SheetDayTab, 'weekday' | 'label' | 'gid'>,
): Mic | null {
  const showName = (row.showName ?? '').trim()
  const dataType = (row.dataType ?? '').trim()
  const status = (row.status ?? '').trim()

  if (!showName) return null
  if (dataType === 'Region' || dataType === 'Notes') return null

  const venueName = (row.venueName ?? '').trim()
  const venueAddress = (row.venueAddress ?? '').trim()
  const frequencyRaw = (row.frequency ?? '').trim()
  const signUpTime = (row.signUpTime ?? '').trim()
  const showtimeRaw = (row.showtime ?? '').trim()
  const producerName = (row.producerName ?? '').trim()
  const extraNotes = (row.extraNotes ?? '').trim()

  const instagramUrls = parseInstagramCell(row.instagram ?? '')
  const linkOutUrls = [
    ...instagramUrls,
    ...extractHttpUrls(extraNotes),
    ...extractHttpUrls(producerName),
  ]

  const id = simpleHash(
    [
      tab.gid,
      showName,
      venueName,
      venueAddress,
      showtimeRaw,
      frequencyRaw,
    ].join('|'),
  )

  return {
    id,
    showName,
    venueName,
    venueAddress,
    frequencyRaw,
    signUpTime,
    showtimeRaw,
    producerName,
    instagramUrls,
    extraNotes,
    linkOutUrls: [...new Set(linkOutUrls)],
    status,
    dataType,
    regionLabel,
    weekdays: [tab.weekday],
    sheetTabDay: tab.label,
    sheetTabGid: tab.gid,
    sortMinutes: parseShowtimeToMinutes(showtimeRaw),
  }
}

function attachSheetCoordinates(mic: Mic, obj: Record<string, string>): void {
  const latRaw =
    obj.Latitude ?? obj.latitude ?? obj.Lat ?? obj.lat ?? ''
  const lngRaw =
    obj.Longitude ?? obj.longitude ?? obj.Lng ?? obj.lng ?? ''
  const lat = parseFloat(String(latRaw).trim())
  const lng = parseFloat(String(lngRaw).trim())
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    mic.sheetLat = lat
    mic.sheetLng = lng
  }
}

export function parseSheetRows(
  rows: Record<string, string>[],
  tab: SheetDayTab,
): Mic[] {
  const mics: Mic[] = []
  let regionLabel = ''

  for (const obj of rows) {
    const dataType = (obj.DataType ?? '').trim()

    if (dataType === 'Region') {
      const title = (obj['Show Name'] ?? '').trim()
      if (title) regionLabel = title
      continue
    }

    const row: RawSheetRow = {
      showName: obj['Show Name'],
      venueName: obj['Venue Name'],
      venueAddress: obj['Venue Address'],
      frequency: obj.Frequency,
      signUpTime: obj['Sign-Up Time'],
      showtime: obj.Showtime,
      producerName: obj['Producer Name'],
      instagram: obj.Instagram,
      extraNotes: obj['Extra Notes'],
      dataType: obj.DataType,
      status: obj.Status,
    }

    const mic = rowToMic(row, regionLabel, tab)
    if (mic) {
      attachSheetCoordinates(mic, obj)
      mics.push(mic)
    }
  }

  return mics
}

/** Monday-first sort index */
const WEEKDAY_SORT_INDEX: Record<number, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  0: 6,
}

export function sortMicsGlobally(mics: Mic[]): Mic[] {
  return [...mics].sort((a, b) => {
    const wa = a.weekdays[0] ?? 0
    const wb = b.weekdays[0] ?? 0
    const da = WEEKDAY_SORT_INDEX[wa] ?? 99
    const db = WEEKDAY_SORT_INDEX[wb] ?? 99
    if (da !== db) return da - db

    const ta = a.sortMinutes
    const tb = b.sortMinutes
    if (ta != null && tb != null && ta !== tb) return ta - tb
    if (ta != null && tb == null) return -1
    if (ta == null && tb != null) return 1
    return a.showName.localeCompare(b.showName)
  })
}

export function micMatchesDay(mic: Mic, day: number): boolean {
  return mic.weekdays.includes(day)
}

export function filterByStatus(mic: Mic): boolean {
  const s = mic.status.toLowerCase()
  return s === 'active' || s === 'upcoming'
}
