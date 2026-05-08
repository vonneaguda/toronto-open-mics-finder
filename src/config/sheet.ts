/** Public Google Sheet backing the listings */
export const SHEET_SPREADSHEET_ID =
  import.meta.env.VITE_SHEET_ID ??
  '1r6nfVJGDuZGAIUHmk_tEwiKLtc27Z8A9KK-kn2Plkqo'

/**
 * One CSV export per weekday tab. Labels and `gid`s match the sheet’s tab
 * switcher (see Google Sheets URL `#gid=` when each tab is selected).
 *
 * If the spreadsheet is reorganized, update these `gid`s from the sheet URL.
 */
export type SheetDayTab = {
  /** Bottom tab title in Google Sheets */
  label: string
  /** Same as `Date.getDay()` in JS: Sun = 0 … Sat = 6 */
  weekday: number
  gid: string
}

export const SHEET_DAY_TABS: readonly SheetDayTab[] = [
  { label: 'Monday', weekday: 1, gid: '1944788027' },
  { label: 'Tuesday', weekday: 2, gid: '487620353' },
  { label: 'Wednesday', weekday: 3, gid: '2053285776' },
  { label: 'Thursday', weekday: 4, gid: '2110746888' },
  { label: 'Friday', weekday: 5, gid: '1722000815' },
  { label: 'Saturday', weekday: 6, gid: '181402081' },
  { label: 'Sunday', weekday: 0, gid: '1248365212' },
] as const

export function sheetCsvUrl(gid: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_SPREADSHEET_ID}/export?format=csv&gid=${gid}`
}
