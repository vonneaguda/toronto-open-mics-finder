import Papa from 'papaparse'
import { EXPECTED_HEADERS } from '../config/columnMap'
import { SHEET_DAY_TABS, sheetCsvUrl } from '../config/sheet'
import {
  filterByStatus,
  parseSheetRows,
  sortMicsGlobally,
  type Mic,
} from './normalize'

export type SheetLoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ok'
      mics: Mic[]
      headerMismatch: boolean
      loadWarnings: string[]
    }

function parseCsv(text: string) {
  return Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })
}

async function fetchDayTab(tab: (typeof SHEET_DAY_TABS)[number]): Promise<{
  mics: Mic[]
  headerMismatch: boolean
  error?: string
}> {
  const url = sheetCsvUrl(tab.gid)
  try {
    const res = await fetch(url)
    if (!res.ok) {
      return {
        mics: [],
        headerMismatch: false,
        error: `${tab.label} tab: HTTP ${res.status}`,
      }
    }
    const text = await res.text()
    const parsed = parseCsv(text)

    if (parsed.errors.length) {
      const fatal = parsed.errors.find((e) => e.type === 'Quotes')
      if (fatal) {
        return {
          mics: [],
          headerMismatch: false,
          error: `${tab.label} tab: CSV parse error`,
        }
      }
    }

    const fields = parsed.meta.fields ?? []
    const headerMismatch = !EXPECTED_HEADERS.every((h) => fields.includes(h))

    let mics = parseSheetRows(parsed.data, tab)
    mics = mics.filter(filterByStatus)

    return { mics, headerMismatch }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      mics: [],
      headerMismatch: false,
      error: `${tab.label} tab: ${msg}`,
    }
  }
}

export async function loadOpenMics(): Promise<SheetLoadState> {
  try {
    const results = await Promise.all(SHEET_DAY_TABS.map((tab) => fetchDayTab(tab)))

    const loadWarnings: string[] = []
    let headerMismatch = false
    const mics: Mic[] = []

    for (const r of results) {
      if (r.error) loadWarnings.push(r.error)
      headerMismatch ||= r.headerMismatch
      mics.push(...r.mics)
    }

    if (mics.length === 0 && loadWarnings.length > 0) {
      return {
        status: 'error',
        message: loadWarnings.join(' · '),
      }
    }

    sortMicsGlobally(mics)

    return { status: 'ok', mics, headerMismatch, loadWarnings }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      status: 'error',
      message: `Network error loading sheet: ${msg}`,
    }
  }
}
