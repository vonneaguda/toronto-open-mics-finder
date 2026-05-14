import { useEffect, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { DayPicker } from './components/DayPicker'
import { MicCard } from './components/MicCard'
import { MicMap } from './components/MicMap'
import { loadOpenMics } from './lib/fetchSheet'
import { micMatchesDay } from './lib/normalize'
import type { Mic } from './lib/normalize'
import {
  categorizeMics,
  formatMicEventDateLabel,
} from './lib/micCategorization'
import { getTorontoTodayYmd, getTorontoWeekdayNow } from './lib/torontoTime'
import { useMicCoordinates } from './hooks/useMicCoordinates'

type Panel = 'list' | 'map'

function torontoMetroFilter(mic: Mic, includeOutside: boolean): boolean {
  if (includeOutside) return true
  const r = mic.regionLabel
  if (!r) return true
  return !r.toLowerCase().includes('outside')
}

function FilterFunnelIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path d="M4 5h16l-6.5 7.5v5L10 21v-8.5L4 5z" strokeLinejoin="round" />
    </svg>
  )
}

export default function App() {
  const [loadState, setLoadState] = useState<Awaited<
    ReturnType<typeof loadOpenMics>
  > | null>(null)
  const todayToronto = useMemo(() => getTorontoWeekdayNow(), [])
  const todayYmd = useMemo(() => getTorontoTodayYmd(), [])
  const [selectedDay, setSelectedDay] = useState(todayToronto)
  const [includeOutside, setIncludeOutside] = useState(false)
  const [panel, setPanel] = useState<Panel>('list')
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    void loadOpenMics().then((s) => {
      if (!cancelled) setLoadState(s)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const allMics = useMemo(
    () => (loadState?.status === 'ok' ? loadState.mics : []),
    [loadState],
  )

  const dayMics = useMemo(() => {
    return allMics.filter(
      (m) =>
        micMatchesDay(m, selectedDay) && torontoMetroFilter(m, includeOutside),
    )
  }, [allMics, selectedDay, includeOutside])

  const { weeklyMics, futureMics } = useMemo(() => {
    return categorizeMics(dayMics, todayYmd)
  }, [dayMics, todayYmd])

  const { coordsById, pending: geoPending } = useMicCoordinates(dayMics)

  const weekdayName =
    [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ][selectedDay] ?? 'Day'

  const primaryListHeading =
    selectedDay === todayToronto
      ? "Today's mics"
      : `${weekdayName}'s mics`

  return (
    <div className="min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-3 md:max-w-6xl">
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight md:text-xl">
              Toronto open mic finder
            </h1>
            <p className="mt-1 hidden max-w-md text-xs text-zinc-500 dark:text-zinc-400 md:block md:text-sm">
              Listings from the community spreadsheet · defaults to today
              (Toronto time)
            </p>
          </div>
          <div className="relative shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-900/20 bg-white px-3 py-2 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
              aria-expanded={filterMenuOpen}
              aria-haspopup="true"
              onClick={() => setFilterMenuOpen((o) => !o)}
            >
              <FilterFunnelIcon />
              Filter
            </button>
            {filterMenuOpen ? (
              <div
                className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                role="menu"
              >
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                    checked={includeOutside}
                    onChange={(e) => setIncludeOutside(e.target.checked)}
                  />
                  <span>Include mics outside Toronto (~90&nbsp;min drive)</span>
                </label>
              </div>
            ) : null}
          </div>
        </div>
        {loadState?.status === 'ok' && loadState.loadWarnings.length > 0 ? (
          <div className="mx-auto mt-3 max-w-lg md:max-w-6xl">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              Some tabs did not load: {loadState.loadWarnings.join(' · ')}
            </p>
          </div>
        ) : null}
        {loadState?.status === 'ok' && loadState.headerMismatch ? (
          <div className="mx-auto mt-2 max-w-lg md:max-w-6xl">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              Sheet columns differ from expected — verify{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">
                src/config/columnMap.ts
              </code>
            </p>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-lg px-4 py-5 md:max-w-6xl md:px-8 md:py-8">
        {loadState?.status === 'error' ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
          >
            <p className="font-semibold">Could not load listings</p>
            <p className="mt-2 text-sm">{loadState.message}</p>
            <p className="mt-4 text-sm">
              Ask the sheet owner to enable{' '}
              <strong>Anyone with the link → Viewer</strong> or use{' '}
              <strong>File → Share → Publish to web</strong> for the workbook.
            </p>
          </div>
        ) : null}

        {loadState?.status === 'loading' || loadState === null ? (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Loading open mics…
          </p>
        ) : null}

        {loadState?.status === 'ok' ? (
          <>
            <section className="space-y-3" aria-label="Day and filters">
              <DayPicker
                selectedDay={selectedDay}
                todayToronto={todayToronto}
                onChange={setSelectedDay}
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 md:text-sm">
                {dayMics.length} mic{dayMics.length === 1 ? '' : 's'} on{' '}
                <strong>{weekdayName}</strong>
                {selectedDay === todayToronto ? ' · sorted by start time' : null}
                {geoPending ? (
                  <span className="ml-1">· map pins loading…</span>
                ) : null}
              </p>
            </section>

            <div className="mt-5 md:hidden">
              <div className="flex rounded-xl bg-zinc-200 p-1 dark:bg-zinc-800">
                <button
                  type="button"
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    panel === 'list'
                      ? 'bg-white text-zinc-900 shadow dark:bg-zinc-950 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                  onClick={() => setPanel('list')}
                >
                  List
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    panel === 'map'
                      ? 'bg-white text-zinc-900 shadow dark:bg-zinc-950 dark:text-zinc-50'
                      : 'text-zinc-600 dark:text-zinc-400'
                  }`}
                  onClick={() => setPanel('map')}
                >
                  Map
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
              <div
                className={`space-y-6 ${panel === 'list' ? 'block' : 'hidden lg:block'}`}
              >
                {dayMics.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                    <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
                      Nothing listed for this day
                    </p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Try another weekday — each day’s rows come from that day’s
                      tab in the source spreadsheet.
                    </p>
                  </div>
                ) : (
                  <>
                    {weeklyMics.length > 0 ? (
                      <div>
                        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {primaryListHeading}
                        </h2>
                        <div className="space-y-3">
                          {weeklyMics.map((mic, i) => (
                            <MicCard key={mic.id} mic={mic} index={i} />
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {futureMics.length > 0 ? (
                      <div>
                        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Future mic
                        </h2>
                        <div className="space-y-3">
                          {futureMics.map((mic, i) => (
                            <MicCard
                              key={mic.id}
                              mic={mic}
                              index={weeklyMics.length + i}
                              dateQualifier={formatMicEventDateLabel(mic, todayYmd)}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              <div
                className={`lg:sticky lg:top-6 ${panel === 'map' ? 'block' : 'hidden lg:block'}`}
              >
                <MicMap mics={dayMics} coordsById={coordsById} />
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Pins use venue addresses (OpenStreetMap, cached on device).
                </p>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 md:px-8">
        Data © contributors — public community spreadsheet.
      </footer>

      {filterMenuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-10 cursor-default bg-transparent"
          aria-label="Close filter menu"
          onClick={() => setFilterMenuOpen(false)}
        />
      ) : null}
    </div>
  )
}
