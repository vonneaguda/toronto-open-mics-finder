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

const COMEDY_DISCIPLINE_RE =
  /\b(comedy|comics?|stand[\s-]?up|improv|crowdwork)\b/i
const MUSIC_DISCIPLINE_RE =
  /\b(music|musicians?|acoustic|singers?)\b/i
const POETRY_DISCIPLINE_RE = /\b(poetry|poets?|spoken[\s-]?word)\b/i
const STORYTELLING_DISCIPLINE_RE = /\bstorytelling\b/i
const DANCE_DISCIPLINE_RE = /\b(dance|dancers?)\b/i
const MAGIC_DISCIPLINE_RE = /\b(magic|magicians?)\b/i
const BURLESQUE_DISCIPLINE_RE = /\bburlesque\b/i
const DRAG_DISCIPLINE_RE = /\bdrag\b/i

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(text))
}

/** Distinct performing-arts disciplines; comedy sub-styles (e.g. storytelling) don't add a second. */
function hasMultipleArtForms(text: string): boolean {
  let count = 0
  const hasComedy = COMEDY_DISCIPLINE_RE.test(text)
  if (hasComedy) count += 1
  if (MUSIC_DISCIPLINE_RE.test(text)) count += 1
  if (POETRY_DISCIPLINE_RE.test(text)) count += 1
  if (STORYTELLING_DISCIPLINE_RE.test(text) && !hasComedy) count += 1
  if (DANCE_DISCIPLINE_RE.test(text)) count += 1
  if (MAGIC_DISCIPLINE_RE.test(text)) count += 1
  if (BURLESQUE_DISCIPLINE_RE.test(text)) count += 1
  if (DRAG_DISCIPLINE_RE.test(text)) count += 1
  return count >= 2
}

function isMultiArtOpenMic(text: string): boolean {
  return (
    matchesAny(text, MULTI_ART_PHRASE_PATTERNS) || hasMultipleArtForms(text)
  )
}

function combineMicText(
  description: string | null | undefined,
  title?: string | null | undefined,
  signUpTime?: string | null | undefined,
): string | null {
  const parts = [title, signUpTime, description]
    .filter((s): s is string => s != null && s.trim() !== '')
    .map((s) => s.trim())
  if (parts.length === 0) return null
  return parts.join('\n')
}

/** Parse format/tags from notes, show title, and sign-up time. */
export function parseMicDetails(
  description: string | null | undefined,
  title?: string | null | undefined,
  signUpTime?: string | null | undefined,
): MicDetails {
  const text = combineMicText(description, title, signUpTime)
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
  signUpTime: string
}): MicDetails {
  return parseMicDetails(mic.extraNotes, mic.showName, mic.signUpTime)
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
  signUpTime?: string | null | undefined
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
    input: '',
    title: 'Backroom Showcase',
    signUpTime: 'booked',
    expected: { format: 'List', tags: ['Booked'] },
  },
  {
    input: 'Weekly showcase.',
    signUpTime: 'Booked',
    expected: { format: 'List', tags: ['Booked'] },
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
  {
    input:
      'Bucket show. Comic spins wheel and does riff/storytelling/crowdwork and mystery challenges.',
    title: 'Wheel Of Comedy',
    expected: { format: 'Bucket', tags: [] },
  },
]
