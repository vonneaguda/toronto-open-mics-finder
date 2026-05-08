import type { Mic } from '../lib/normalize'

function isInstagramUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    return h === 'instagram.com' || h.endsWith('.instagram.com')
  } catch {
    return false
  }
}

/** Display handle from instagram.com/{handle} (skips /p/, /reel/, etc.) */
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

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

function DirectionsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  )
}

type Props = { mic: Mic }

export function MicCard({ mic }: Props) {
  const igUrls = [
    ...new Set([
      ...mic.instagramUrls,
      ...mic.linkOutUrls.filter((u) => isInstagramUrl(u)),
    ]),
  ]
  const otherUrls = mic.linkOutUrls.filter((u) => !isInstagramUrl(u))

  const dest = directionsDestination(mic)
  const canDirections = Boolean(dest)

  const hasActions = canDirections || igUrls.length > 0 || otherUrls.length > 0

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white text-left shadow-sm ring-1 ring-black/[0.03] dark:border-zinc-700 dark:bg-zinc-900 dark:ring-white/[0.05]">
      {/* Header */}
      <div className="border-b border-zinc-100 px-4 pb-3 pt-4 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
          <h2 className="min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {mic.showName}
          </h2>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            <span
              className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-900 dark:bg-violet-950/80 dark:text-violet-200"
              title={`Listed under the “${mic.sheetTabDay}” tab in the spreadsheet`}
            >
              {mic.sheetTabDay}
            </span>
            {mic.status ? (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {mic.status}
              </span>
            ) : null}
          </div>
        </div>

        {/* Location — scan-first */}
        {(mic.venueName || mic.venueAddress) && (
          <div className="mt-3">
            {mic.venueName ? (
              <p className="font-semibold text-zinc-800 dark:text-zinc-100">
                {mic.venueName}
              </p>
            ) : null}
            {mic.venueAddress ? (
              <p className="mt-0.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {mic.venueAddress}
              </p>
            ) : null}
            {mic.regionLabel ? (
              <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-500">
                {mic.regionLabel}
              </p>
            ) : null}
          </div>
        )}
      </div>

      {/* Quick facts — time-first for comics */}
      {(mic.showtimeRaw ||
        mic.signUpTime ||
        mic.frequencyRaw ||
        mic.producerName) && (
        <div className="grid gap-3 px-4 py-3 sm:grid-cols-2">
          {(mic.showtimeRaw || mic.signUpTime) && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 sm:col-span-2">
              {mic.showtimeRaw ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Showtime
                  </p>
                  <p className="mt-0.5 text-base font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {mic.showtimeRaw}
                  </p>
                </div>
              ) : null}
              {mic.signUpTime ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Sign-up
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                    {mic.signUpTime}
                  </p>
                </div>
              ) : null}
            </div>
          )}
          {mic.frequencyRaw ? (
            <div className="sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Schedule
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {mic.frequencyRaw}
              </p>
            </div>
          ) : null}
          {mic.producerName ? (
            <div className="sm:col-span-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                Producer
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                {mic.producerName}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {mic.extraNotes ? (
        <div className="border-t border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Notes
          </p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {mic.extraNotes}
          </p>
        </div>
      ) : null}

      {/* Actions */}
      {hasActions ? (
        <div className="flex flex-col gap-2 border-t border-zinc-100 bg-zinc-50/80 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/50">
          <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Links
          </p>
          <div className="flex flex-wrap gap-2">
            {canDirections ? (
              <a
                href={googleMapsDirectionsHref(dest)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 min-w-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800 active:bg-zinc-950 sm:flex-initial dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                aria-label={`Get directions to ${dest}`}
              >
                <DirectionsIcon className="shrink-0 opacity-90" />
                Directions
              </a>
            ) : null}

            {igUrls.map((url) => {
              const handle = instagramHandleFromUrl(url)
              return (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 active:brightness-95"
                  aria-label={`@${handle} on Instagram`}
                >
                  <InstagramIcon className="shrink-0 opacity-95" />
                  <span className="tabular-nums">@{handle}</span>
                </a>
              )
            })}

            {otherUrls.map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {linkLabel(url)}
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  )
}
