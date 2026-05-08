import type { Mic } from '../lib/normalize'

function isInstagramUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.replace(/^www\./, '')
    return h === 'instagram.com' || h.endsWith('.instagram.com')
  } catch {
    return false
  }
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

type Props = { mic: Mic }

export function MicCard({ mic }: Props) {
  const igUrls = [
    ...new Set([
      ...mic.instagramUrls,
      ...mic.linkOutUrls.filter((u) => isInstagramUrl(u)),
    ]),
  ]
  const otherUrls = mic.linkOutUrls.filter((u) => !isInstagramUrl(u))

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {mic.showName}
        </h2>
        <div className="flex flex-wrap gap-1">
          <span
            className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-900 dark:bg-violet-950/80 dark:text-violet-200"
            title={`Listed under the “${mic.sheetTabDay}” tab in the spreadsheet`}
          >
            {mic.sheetTabDay} sheet
          </span>
          {mic.status ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {mic.status}
            </span>
          ) : null}
        </div>
      </div>

      {mic.venueName ? (
        <p className="mt-1 font-medium text-zinc-800 dark:text-zinc-200">
          {mic.venueName}
        </p>
      ) : null}

      {mic.venueAddress ? (
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {mic.venueAddress}
        </p>
      ) : null}

      {mic.regionLabel ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
          {mic.regionLabel}
        </p>
      ) : null}

      <dl className="mt-3 grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        {mic.showtimeRaw ? (
          <div className="flex gap-2">
            <dt className="min-w-[6rem] font-medium text-zinc-500">Showtime</dt>
            <dd>{mic.showtimeRaw}</dd>
          </div>
        ) : null}
        {mic.signUpTime ? (
          <div className="flex gap-2">
            <dt className="min-w-[6rem] font-medium text-zinc-500">Sign-up</dt>
            <dd>{mic.signUpTime}</dd>
          </div>
        ) : null}
        {mic.frequencyRaw ? (
          <div className="flex gap-2">
            <dt className="min-w-[6rem] font-medium text-zinc-500">Schedule</dt>
            <dd className="whitespace-pre-wrap">{mic.frequencyRaw}</dd>
          </div>
        ) : null}
        {mic.producerName ? (
          <div className="flex gap-2">
            <dt className="min-w-[6rem] font-medium text-zinc-500">Producer</dt>
            <dd className="whitespace-pre-wrap">{mic.producerName}</dd>
          </div>
        ) : null}
      </dl>

      {mic.extraNotes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {mic.extraNotes}
        </p>
      ) : null}

      {igUrls.length || otherUrls.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {igUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:opacity-90"
            >
              Instagram
            </a>
          ))}
          {otherUrls.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
            >
              {linkLabel(url)}
            </a>
          ))}
        </div>
      ) : null}
    </article>
  )
}
