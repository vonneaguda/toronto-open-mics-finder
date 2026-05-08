/**
 * Maps exact CSV header strings from the sheet to logical field keys.
 * Update here if the sheet headers change.
 */
export const COLUMN_KEYS = [
  'showName',
  'venueName',
  'venueAddress',
  'frequency',
  'signUpTime',
  'showtime',
  'producerName',
  'instagram',
  'extraNotes',
  'dataType',
  'status',
] as const

export type ColumnKey = (typeof COLUMN_KEYS)[number]

/** Expected header row (for validation / debugging) */
export const EXPECTED_HEADERS: readonly string[] = [
  'Show Name',
  'Venue Name',
  'Venue Address',
  'Frequency',
  'Sign-Up Time',
  'Showtime',
  'Producer Name',
  'Instagram',
  'Extra Notes',
  'DataType',
  'Status',
]

export const HEADER_TO_KEY: Record<string, ColumnKey> = {
  'Show Name': 'showName',
  'Venue Name': 'venueName',
  'Venue Address': 'venueAddress',
  Frequency: 'frequency',
  'Sign-Up Time': 'signUpTime',
  Showtime: 'showtime',
  'Producer Name': 'producerName',
  Instagram: 'instagram',
  'Extra Notes': 'extraNotes',
  DataType: 'dataType',
  Status: 'status',
}
