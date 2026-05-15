import { useId, useState } from 'react'
import type { Mic } from '../lib/normalize'

function isInstagramUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    return h === 'instagram.com' || h.endsWith('.instagram.com')
  } catch {
    return false
  }
}

function instagramHandleFromUrl(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const skipRoots = new Set(['p', 'reel', 'reels', 'stories', 'explore', 'tv'])
    if (parts.length === 0) return 'instagram'
    if (!skipRoots.has(parts[0])) {
      return decodeURIComponent(parts[0]).replace(/^@/, '')
    }
    return parts.join('/').slice(0, 24) || 'instagram'
  } catch {
    return 'instagram'
  }
}

function directionsDestination(mic: Mic): string {
  const bits = [mic.venueName, mic.venueAddress].filter(Boolean)
  return bits.join(', ').trim()
}

function googleMapsDirectionsHref(destination: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`
}

function linkLabel(url: string): string {
  try {
    const u = new URL(url)
    if (isInstagramUrl(url)) return 'Instagram'
    const host = u.hostname.replace(/^www\./, '')
    if (host.includes('facebook.')) return 'Facebook'
    if (host.includes('eventbrite.')) return 'Eventbrite'
    if (host.includes('yukyuks')) return 'Yuk Yuk’s site'
    if (host.includes('thecornercomedy')) return 'Venue site'
    return host || 'Link'
  } catch {
    return 'Link'
  }
}

function ListIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function BucketIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 10h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8z" />
      <path d="M8 10V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v4" />
    </svg>
  )
}

function RainbowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M4 16c2-4 6-6 8-6s6 2 8 6"
        stroke="#ef4444"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M6 16c1.5-3 4-4.5 6-4.5s4.5 1.5 6 4.5"
        stroke="#f97316"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M8 16c1-2 2.5-3 4-3s3 1 4 3"
        stroke="#eab308"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  )
}

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function extractFormat(notes: string): 'list' | 'bucket' | null {
  if (!notes) return null
  const lower = notes.toLowerCase()
  if (
    lower.includes('sign-up list') ||
    lower.includes('sign up list') ||
    /\blist\b/.test(lower) ||
    lower.includes('lottery')
  ) {
    if (lower.includes('bucket')) return 'bucket'
    return 'list'
  }
  if (
    lower.includes('bucket') ||
    lower.includes('draw') ||
    lower.includes('random order')
  ) {
    return 'bucket'
  }
  return null
}

function producerParts(name: string): string[] {
  return name
    .split(/[,/&\n]+/g)
    .map((s) => s.trim())
    .filter(Boolean)
}

type Props = {
  mic: Mic
  /** Shown after title, e.g. May 24 — for dated future mics */
  dateQualifier?: string | null
}

export function MicCard({ mic, dateQualifier }: Props) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()

  const igUrls = [
    ...new Set([
      ...mic.instagramUrls,
      ...mic.linkOutUrls.filter((u) => isInstagramUrl(u)),
    ]),
  ]
  const otherUrls = mic.linkOutUrls.filter((u) => !isInstagramUrl(u))

  const dest = directionsDestination(mic)
  const canDirections = Boolean(dest)
  const format = extractFormat(mic.extraNotes)
  const producers = producerParts(mic.producerName)
  const lgbtqPriority = /\b(lgbtq?|2slgbtq|queer|pride)\b/i.test(
    mic.extraNotes ?? '',
  )

  const title =
    dateQualifier && dateQualifier.length > 0
      ? `${mic.showName} (${dateQualifier})`
      : mic.showName

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-900/15 bg-zinc-100 text-left dark:border-zinc-600 dark:bg-zinc-900/80">
      <button
        type="button"
        className="flex w-full items-start gap-4 p-4 text-left transition hover:bg-zinc-200/60 dark:hover:bg-zinc-800/80"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {mic.venueName}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {format === 'list' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-900/20 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
                <ListIcon className="opacity-70" />
                List
              </span>
            ) : null}
            {format === 'bucket' ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-900/20 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
                <BucketIcon className="opacity-70" />
                Bucket
              </span>
            ) : null}
            {lgbtqPriority ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-zinc-900/20 bg-white px-2.5 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200">
                <RainbowIcon />
                LGBTQ+ priority
              </span>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-sm tabular-nums text-zinc-900 dark:text-zinc-50">
            {mic.signUpTime ? (
              <div>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  Sign up
                </span>
                {mic.signUpTime}
              </div>
            ) : null}
            {mic.showtimeRaw ? (
              <div className={mic.signUpTime ? 'mt-1.5' : ''}>
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
                  Starts
                </span>
                {mic.showtimeRaw}
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {expanded ? (
        <div
          id={panelId}
          className="space-y-3 border-t border-zinc-900/10 px-4 pb-4 pt-3 text-sm dark:border-zinc-700"
        >
          {producers.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Producer{producers.length > 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-zinc-800 dark:text-zinc-200">
                {producers.join(' · ')}
              </p>
            </div>
          ) : null}

          {igUrls.length > 0 || otherUrls.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Socials
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {igUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <InstagramGlyph className="opacity-90" />
                    @{instagramHandleFromUrl(url)}
                  </a>
                ))}
                {otherUrls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-zinc-900/20 bg-white px-3 py-1 text-xs font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
                  >
                    {linkLabel(url)}
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {mic.extraNotes.trim() ? (
            <div>
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                {mic.extraNotes}
              </p>
            </div>
          ) : null}

          {canDirections ? (
            <a
              href={googleMapsDirectionsHref(dest)}
              target="_blank"
              rel="noopener noreferrer"
              className="-mx-4 mt-3 flex w-[calc(100%+2rem)] max-w-none items-center justify-center rounded-xl border border-zinc-900/25 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-800/80"
            >
              Directions
            </a>
          ) : null}
        </div>
      ) : null}
    </article>
  )
}
