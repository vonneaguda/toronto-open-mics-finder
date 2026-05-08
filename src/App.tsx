import { useEffect, useMemo, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { DayPicker } from './components/DayPicker'
import { MicCard } from './components/MicCard'
import { MicMap } from './components/MicMap'
import { loadOpenMics } from './lib/fetchSheet'
import { micMatchesDay } from './lib/normalize'
import type { Mic } from './lib/normalize'
import { getTorontoWeekdayNow } from './lib/torontoTime'
import { useMicCoordinates } from './hooks/useMicCoordinates'

type Panel = 'list' | 'map'

function torontoMetroFilter(mic: Mic, includeOutside: boolean): boolean {
  if (includeOutside) return true
  const r = mic.regionLabel
  if (!r) return true
  return !r.toLowerCase().includes('outside')
}

export default function App() {
  const [loadState, setLoadState] = useState<Awaited<
    ReturnType<typeof loadOpenMics>
  > | null>(null)
  const todayToronto = useMemo(() => getTorontoWeekdayNow(), [])
  const [selectedDay, setSelectedDay] = useState(todayToronto)
  const [includeOutside, setIncludeOutside] = useState(false)
  const [panel, setPanel] = useState<Panel>('list')

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

  const filtered = useMemo(() => {
    return allMics.filter(
      (m) =>
        micMatchesDay(m, selectedDay) && torontoMetroFilter(m, includeOutside),
    )
  }, [allMics, selectedDay, includeOutside])

  const { coordsById, pending: geoPending } = useMicCoordinates(filtered)

  const matchesTodayCount = useMemo(() => {
    return allMics.filter(
      (m) =>
        micMatchesDay(m, todayToronto) && torontoMetroFilter(m, includeOutside),
    ).length
  }, [allMics, todayToronto, includeOutside])

  return (
    <div className="min-h-svh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="border-b border-zinc-200 bg-white/90 px-4 py-6 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90 md:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-wide text-violet-600 dark:text-violet-400">
            Toronto comedy
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
            Open mics finder
          </h1>
          <p className="mt-2 max-w-2xl text-base text-zinc-600 dark:text-zinc-400">
            Listings match the community spreadsheet:{' '}
            <strong>each weekday has its own tab</strong> (Monday–Sunday). This site
            loads every tab and filters by the day you pick (defaults to today in
            Toronto time).
          </p>
          {loadState?.status === 'ok' && loadState.loadWarnings.length > 0 ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
              Some tabs did not load: {loadState.loadWarnings.join(' · ')}
            </p>
          ) : null}
          {loadState?.status === 'ok' && loadState.headerMismatch ? (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/50 dark:text-amber-100">
              Sheet columns differ from expected headers — verify{' '}
              <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/60">
                src/config/columnMap.ts
              </code>{' '}
              if fields look wrong.
            </p>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
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
          <p className="text-center text-zinc-600 dark:text-zinc-400">
            Loading open mics…
          </p>
        ) : null}

        {loadState?.status === 'ok' ? (
          <>
            <section className="space-y-4" aria-label="Filters">
              <DayPicker
                selectedDay={selectedDay}
                todayToronto={todayToronto}
                onChange={setSelectedDay}
              />
              <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                  checked={includeOutside}
                  onChange={(e) => setIncludeOutside(e.target.checked)}
                />
                Include mics outside Toronto (~90&nbsp;min drive)
              </label>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {filtered.length} mic
                {filtered.length === 1 ? '' : 's'} on{' '}
                <strong>
                  {
                    [
                      'Sunday',
                      'Monday',
                      'Tuesday',
                      'Wednesday',
                      'Thursday',
                      'Friday',
                      'Saturday',
                    ][selectedDay]
                  }
                </strong>
                {selectedDay === todayToronto
                  ? ` · ${matchesTodayCount} total today in Toronto filter`
                  : null}
                {geoPending ? (
                  <span className="ml-2 text-zinc-500">
                    · pinning map locations…
                  </span>
                ) : null}
              </p>
            </section>

            <div className="mt-6 md:hidden">
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

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
              <div
                className={`space-y-4 ${panel === 'list' ? 'block' : 'hidden lg:block'}`}
              >
                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                    <p className="text-lg font-medium text-zinc-800 dark:text-zinc-100">
                      Nothing listed for this day
                    </p>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                      Try another weekday tab — each day’s mics live on that day’s
                      sheet tab in the source document.
                    </p>
                  </div>
                ) : (
                  filtered.map((mic) => <MicCard key={mic.id} mic={mic} />)
                )}
              </div>

              <div
                className={`lg:sticky lg:top-6 ${panel === 'map' ? 'block' : 'hidden lg:block'}`}
              >
                <MicMap mics={filtered} coordsById={coordsById} />
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  Map search uses venue addresses via OpenStreetMap (cached on your
                  device). First load may take a few seconds per pin.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </main>

      <footer className="border-t border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-500 md:px-8">
        Data © contributors — sourced from the public community spreadsheet.
      </footer>
    </div>
  )
}
