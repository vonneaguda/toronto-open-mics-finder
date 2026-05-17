export type MicFormat = 'Bucket' | 'List' | 'Unknown'

export type MicDetails = {
  format: MicFormat
  tags: string[]
}

export const MIC_FORMAT_FILTERS = ['List', 'Bucket'] as const
export type MicFormatFilter = (typeof MIC_FORMAT_FILTERS)[number]

export const MIC_TAG_FILTERS = [
  'LGBTQIA+',
  'Safe Space',
  'Booked',
  'Multi-art',
] as const
export type MicTagFilter = (typeof MIC_TAG_FILTERS)[number]

const BUCKET_PATTERNS: RegExp[] = [
  /\bbucket\b/i,
  /\bdraw\b/i,
  /\blottery\b/i,
  /\blotto\b/i,
  /\bpulled\b/i,
  /\bhat\b/i,
  /\bhalf\b/i,
  /\bmix\b/i,
  /\bhybrid\b/i,
  /\bboth\b/i,
]

/** Primary list signal — wins over bucket when both appear (hybrid shows). */
const ONLINE_SIGNUP_PATTERN = /\bonline[\s-]?sign[\s-]?up\b/i

const LIST_PATTERNS: RegExp[] = [
  /\blist\b/i,
  ONLINE_SIGNUP_PATTERN,
  /\bsign[\s-]?up\b/i,
  /\bbooked\b/i,
  /\badvance\b/i,
  /\bpre[\s-]?book\b/i,
  /\bguaranteed\b/i,
]

const LGBTQ_PATTERNS: RegExp[] = [
  /\blgbtq\b/i,
  /\blgbtq\+\b/i,
  /\blgbtqia\b/i,
  /\blgbtqia\+\b/i,
  /\bqueer\b/i,
  /\btrans\b/i,
  /\bfemme\b/i,
]

const SAFE_SPACE_PATTERNS: RegExp[] = [
  /\bsafe\s+space\b/i,
  /\binclusive\b/i,
  /\bzero\s+tolerance\b/i,
  /\balt\s+room\b/i,
]

const BOOKED_PATTERNS: RegExp[] = [
  /\bbooked\b/i,
  /\bbookings?\b/i,
]

const MULTI_ART_PHRASE_PATTERNS: RegExp[] = [
  /\bperformers?\s+of\s+all\s+kinds?\b/i,
  /\ball\s+kinds?\s+(of\s+)?(performers?|acts?|artists?)\b/i,
  /\b(all|any)\s+(kinds?|types?)\s+(of\s+)?(performers?|acts?|artists?|talent)\b/i,
  /\bmulti[\s-]?art\b/i,
  /\bvariety\s+(open\s+)?mic\b/i,
  /\b(open\s+)?mic\b[^.]{0,80}\b(comedy|music|poetry)\b[^.]{0,80}\b(and more|etc\.?)\b/i,
  /\b(comedy|music|poetry)\b[^.]{0,80}\b(and more|etc\.?)\b/i,
]

/** One regex per art discipline; tag when two or more match. */
const ART_FORM_CATEGORIES: RegExp[] = [
  /\bcomedy\b/i,
  /\bcomics?\b/i,
  /\bmusic\b/i,
  /\bmusicians?\b/i,
  /\bacoustic\b/i,
  /\bsingers?\b/i,
  /\bpoetry\b/i,
  /\bpoets?\b/i,
  /\bspoken[\s-]?word\b/i,
  /\bstorytelling\b/i,
  /\bdance\b/i,
  /\bdancers?\b/i,
  /\bmagic\b/i,
  /\bmagicians?\b/i,
  /\bimprov\b/i,
  /\bburlesque\b/i,
  /\bdrag\b/i,
]

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text))
}

function hasMultipleArtForms(text: string): boolean {
  let count = 0
  for (const re of ART_FORM_CATEGORIES) {
    if (re.test(text)) {
      count += 1
      if (count >= 2) return true
    }
  }
  return false
}

function isMultiArtOpenMic(text: string): boolean {
  return (
    matchesAny(text, MULTI_ART_PHRASE_PATTERNS) || hasMultipleArtForms(text)
  )
}

function combineMicText(
  description: string | null | undefined,
  title?: string | null | undefined,
): string | null {
  const parts = [title, description]
    .filter((s): s is string => s != null && s.trim() !== '')
    .map((s) => s.trim())
  if (parts.length === 0) return null
  return parts.join('\n')
}

/** Parse format/tags from mic notes and optional show title. */
export function parseMicDetails(
  description: string | null | undefined,
  title?: string | null | undefined,
): MicDetails {
  const text = combineMicText(description, title)
  if (text == null) {
    return { format: 'Unknown', tags: [] }
  }

  let format: MicFormat = 'Unknown'
  if (ONLINE_SIGNUP_PATTERN.test(text)) {
    format = 'List'
  } else if (matchesAny(text, BUCKET_PATTERNS)) {
    format = 'Bucket'
  } else if (matchesAny(text, LIST_PATTERNS)) {
    format = 'List'
  }

  const tags: string[] = []
  if (matchesAny(text, LGBTQ_PATTERNS)) {
    tags.push('LGBTQIA+')
  }
  if (matchesAny(text, SAFE_SPACE_PATTERNS)) {
    tags.push('Safe Space')
  }
  if (matchesAny(text, BOOKED_PATTERNS)) {
    tags.push('Booked')
  }
  if (isMultiArtOpenMic(text)) {
    tags.push('Multi-art')
  }

  return { format, tags }
}

export function parseMicDetailsForMic(mic: {
  extraNotes: string
  showName: string
}): MicDetails {
  return parseMicDetails(mic.extraNotes, mic.showName)
}

/** AND across format vs tag groups; OR within each group when multiple are selected. */
export function micMatchesDetailFilters(
  details: MicDetails,
  formatFilters: readonly MicFormatFilter[],
  tagFilters: readonly MicTagFilter[],
): boolean {
  if (
    formatFilters.length > 0 &&
    !formatFilters.includes(details.format as MicFormatFilter)
  ) {
    return false
  }
  if (
    tagFilters.length > 0 &&
    !tagFilters.some((tag) => details.tags.includes(tag))
  ) {
    return false
  }
  return true
}

/** Example inputs → expected `parseMicDetails` output */
export const PARSE_MIC_DETAILS_TESTS: ReadonlyArray<{
  input: string | null | undefined
  title?: string | null | undefined
  expected: MicDetails
}> = [
  {
    input: 'Advance sign up. Queer and femme safe space.',
    expected: {
      format: 'List',
      tags: ['LGBTQIA+', 'Safe Space'],
    },
  },
  {
    input: 'Bucket mic.',
    expected: { format: 'Bucket', tags: [] },
  },
  {
    input: null,
    expected: { format: 'Unknown', tags: [] },
  },
  {
    input: undefined,
    expected: { format: 'Unknown', tags: [] },
  },
  {
    input: '   ',
    expected: { format: 'Unknown', tags: [] },
  },
  {
    input: 'Hybrid draw — LGBTQ+ night, zero tolerance policy.',
    expected: {
      format: 'Bucket',
      tags: ['LGBTQIA+', 'Safe Space'],
    },
  },
  {
    input: 'Pre-book guaranteed spot. Inclusive room.',
    expected: {
      format: 'List',
      tags: ['Safe Space'],
    },
  },
  {
    input: 'Lottery list (hat pull).',
    expected: { format: 'Bucket', tags: [] },
  },
  {
    input: 'Lotto at door.',
    expected: { format: 'Bucket', tags: [] },
  },
  {
    input: 'Online sign-up required before the show.',
    expected: { format: 'List', tags: [] },
  },
  {
    input:
      'Online signup will be posted the day before on IG and FB. 5 minute sets. MUST be there by 7 or you lose your spot to a walk-in. 17 spots online signup. 4 for bucket (draw will be at start of show). If you can\'t make it, pls remove your name from the list.',
    expected: { format: 'List', tags: [] },
  },
  {
    input: 'Great comics every week.',
    expected: { format: 'Unknown', tags: [] },
  },
  {
    input: 'Alt room for trans performers.',
    expected: {
      format: 'Unknown',
      tags: ['LGBTQIA+', 'Safe Space'],
    },
  },
  {
    input: '',
    title: 'Queer Femme List Mic',
    expected: {
      format: 'List',
      tags: ['LGBTQIA+'],
    },
  },
  {
    input: 'Weekly show.',
    title: 'Hybrid Hat Draw',
    expected: { format: 'Bucket', tags: [] },
  },
  {
    input: 'Bookings only done through Instagram DMs.',
    expected: { format: 'Unknown', tags: ['Booked'] },
  },
  {
    input: "Students of Backroom's Dojo program get booked.",
    expected: { format: 'List', tags: ['Booked'] },
  },
  {
    input: 'Booked comics only. Hat draw for walk-ins.',
    expected: { format: 'Bucket', tags: ['Booked'] },
  },
  {
    input: 'Performers of all kind welcome (comedy, music, etc).',
    expected: { format: 'Unknown', tags: ['Multi-art'] },
  },
  {
    input: 'Music, comedy, poetry and more. Free Times calendar',
    expected: { format: 'Unknown', tags: ['Multi-art'] },
  },
  {
    input: 'Stand-up comedy open mic. 5 minute sets.',
    expected: { format: 'Unknown', tags: [] },
  },
]
