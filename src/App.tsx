import { useEffect, useMemo, useState } from 'react'
import { DayPicker } from './components/DayPicker'
import { MicCard } from './components/MicCard'
import { SHEET_SPREADSHEET_URL } from './config/sheet'
import { loadOpenMics } from './lib/fetchSheet'
import { micMatchesDay } from './lib/normalize'
import type { Mic } from './lib/normalize'
import {
  categorizeMics,
  formatMicEventDateLabel,
  isPastDatedMic,
} from './lib/micCategorization'
import { getTorontoTodayYmd, getTorontoWeekdayNow } from './lib/torontoTime'
import {
  MIC_FORMAT_FILTERS,
  MIC_TAG_FILTERS,
  micMatchesDetailFilters,
  parseMicDetailsForMic,
  type MicFormatFilter,
  type MicTagFilter,
} from './lib/parseMicDetails'

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

type SortMode = 'time' | 'alpha'

function toggleFilter<T extends string>(selected: T[], value: T): T[] {
  return selected.includes(value)
    ? selected.filter((v) => v !== value)
    : [...selected, value]
}

function compareMics(a: Mic, b: Mic, mode: SortMode): number {
  if (mode === 'alpha') {
    return a.showName.localeCompare(b.showName, undefined, {
      sensitivity: 'base',
    })
  }
  const ta = a.sortMinutes ?? Infinity
  const tb = b.sortMinutes ?? Infinity
  if (ta !== tb) return ta - tb
  return a.showName.localeCompare(b.showName, undefined, {
    sensitivity: 'base',
  })
}

function sortMicList(mics: Mic[], mode: SortMode, todayYmd: number): Mic[] {
  const active: Mic[] = []
  const past: Mic[] = []
  for (const mic of mics) {
    if (isPastDatedMic(mic, todayYmd)) past.push(mic)
    else active.push(mic)
  }
  active.sort((a, b) => compareMics(a, b, mode))
  past.sort((a, b) => compareMics(a, b, mode))
  return [...active, ...past]
}

export default function App() {
  const [loadState, setLoadState] = useState<Awaited<
    ReturnType<typeof loadOpenMics>
  > | null>(null)
  const todayToronto = useMemo(() => getTorontoWeekdayNow(), [])
  const todayYmd = useMemo(() => getTorontoTodayYmd(), [])
  const [selectedDay, setSelectedDay] = useState(todayToronto)
  const [includeOutside, setIncludeOutside] = useState(false)
  const [filterMenuOpen, setFilterMenuOpen] = useState(false)
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [formatFilters, setFormatFilters] = useState<MicFormatFilter[]>([])
  const [tagFilters, setTagFilters] = useState<MicTagFilter[]>([])

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

  const hasDetailFilters =
    formatFilters.length > 0 || tagFilters.length > 0

  const filteredDayMics = useMemo(() => {
    if (!hasDetailFilters) return dayMics
    return dayMics.filter((mic) => {
      const details = parseMicDetailsForMic(mic)
      return micMatchesDetailFilters(details, formatFilters, tagFilters)
    })
  }, [dayMics, formatFilters, tagFilters, hasDetailFilters])

  const { weeklyMics, futureMics } = useMemo(() => {
    return categorizeMics(filteredDayMics, todayYmd)
  }, [filteredDayMics, todayYmd])

  const sortedWeeklyMics = useMemo(
    () => sortMicList(weeklyMics, sortMode, todayYmd),
    [weeklyMics, sortMode, todayYmd],
  )
  const sortedFutureMics = useMemo(
    () => sortMicList(futureMics, sortMode, todayYmd),
    [futureMics, sortMode, todayYmd],
  )

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
      ? `Today's ${weekdayName} mics`
      : `${weekdayName} mics`

  return (
    <div className="min-h-svh overflow-x-hidden bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-4 py-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto max-w-lg md:max-w-6xl">
          <h1 className="text-lg font-bold leading-tight tracking-tight md:text-xl">
            PocketMic
          </h1>
          <p className="mt-1 hidden max-w-md text-xs text-zinc-500 dark:text-zinc-400 md:block md:text-sm">
            Listings from the community spreadsheet · defaults to today
            (Toronto time)
          </p>
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
            <section className="space-y-3" aria-label="Day, count, sort, and filters">
              <DayPicker
                selectedDay={selectedDay}
                todayToronto={todayToronto}
                onChange={setSelectedDay}
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-3 sm:gap-y-2">
                <p className="min-w-0 text-xs text-zinc-600 dark:text-zinc-400 md:text-sm">
                  {hasDetailFilters ? (
                    <>
                      {filteredDayMics.length} of {dayMics.length} mic
                      {dayMics.length === 1 ? '' : 's'}
                    </>
                  ) : (
                    <>
                      {dayMics.length} mic{dayMics.length === 1 ? '' : 's'}
                    </>
                  )}{' '}
                  on{' '}
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    {weekdayName}
                  </strong>
                </p>
                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end">
                  <label className="sr-only" htmlFor="mic-sort">
                    Sort mics
                  </label>
                  <select
                    id="mic-sort"
                    value={sortMode}
                    onChange={(e) =>
                      setSortMode(e.target.value as SortMode)
                    }
                    className="min-w-0 w-full rounded-lg border border-zinc-900/20 bg-white py-1.5 pl-2 pr-8 text-xs font-medium text-zinc-800 shadow-sm sm:w-auto dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 md:text-sm"
                  >
                    <option value="time">Earliest start</option>
                    <option value="alpha">A–Z</option>
                  </select>
                  <div className="relative min-w-0">
                    <button
                      type="button"
                      className={`inline-flex w-full items-center justify-start gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium shadow-sm sm:w-auto md:py-2 md:text-sm ${
                        hasDetailFilters
                          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                          : 'border-zinc-900/20 bg-white text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100'
                      }`}
                      aria-expanded={filterMenuOpen}
                      aria-haspopup="true"
                      onClick={() => setFilterMenuOpen((o) => !o)}
                    >
                      <FilterFunnelIcon />
                      Filter
                      <span
                        className={`ml-auto min-w-[1.125rem] rounded-full px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums ${
                          hasDetailFilters
                            ? 'bg-white/20 dark:bg-zinc-900/20'
                            : 'invisible'
                        }`}
                        aria-hidden={!hasDetailFilters}
                      >
                        {formatFilters.length + tagFilters.length || 0}
                      </span>
                    </button>
                    {filterMenuOpen ? (
                      <div
                        className="absolute right-0 z-30 mt-2 max-h-[min(70vh,28rem)] w-[min(18rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-3 text-left shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
                        role="menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Region
                        </p>
                        <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-zinc-800 dark:text-zinc-200">
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                            checked={includeOutside}
                            onChange={(e) =>
                              setIncludeOutside(e.target.checked)
                            }
                          />
                          <span>
                            Include mics outside Toronto (~90&nbsp;min drive)
                          </span>
                        </label>

                        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Sign-up format
                        </p>
                        <div className="mt-2 space-y-2">
                          {MIC_FORMAT_FILTERS.map((format) => (
                            <label
                              key={format}
                              className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-200"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                                checked={formatFilters.includes(format)}
                                onChange={() =>
                                  setFormatFilters((prev) =>
                                    toggleFilter(prev, format),
                                  )
                                }
                              />
                              <span>{format}</span>
                            </label>
                          ))}
                        </div>

                        <p className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                          Tags
                        </p>
                        <div className="mt-2 space-y-2">
                          {MIC_TAG_FILTERS.map((tag) => (
                            <label
                              key={tag}
                              className="flex cursor-pointer items-center gap-2.5 text-sm text-zinc-800 dark:text-zinc-200"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400 dark:border-zinc-600"
                                checked={tagFilters.includes(tag)}
                                onChange={() =>
                                  setTagFilters((prev) =>
                                    toggleFilter(prev, tag),
                                  )
                                }
                              />
                              <span>{tag}</span>
                            </label>
                          ))}
                        </div>

                        {hasDetailFilters ? (
                          <button
                            type="button"
                            className="mt-4 w-full rounded-lg border border-zinc-900/15 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            onClick={() => {
                              setFormatFilters([])
                              setTagFilters([])
                            }}
                          >
                            Clear format &amp; tag filters
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <div className="mt-5 space-y-6">
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
              ) : filteredDayMics.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
                  <p className="text-base font-medium text-zinc-800 dark:text-zinc-100">
                    No mics match your filters
                  </p>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Try clearing format or tag filters, or pick a different day.
                  </p>
                  <button
                    type="button"
                    className="mt-4 rounded-lg border border-zinc-900/20 bg-white px-4 py-2 text-sm font-medium text-zinc-800 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200"
                    onClick={() => {
                      setFormatFilters([])
                      setTagFilters([])
                    }}
                  >
                    Clear format &amp; tag filters
                  </button>
                </div>
              ) : (
                <>
                  {weeklyMics.length > 0 ? (
                    <div>
                      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {primaryListHeading}
                      </h2>
                      <div className="space-y-3">
                        {sortedWeeklyMics.map((mic) => {
                          const past = isPastDatedMic(mic, todayYmd)
                          return (
                            <MicCard
                              key={mic.id}
                              mic={mic}
                              dateQualifier={
                                past
                                  ? formatMicEventDateLabel(mic, todayYmd)
                                  : null
                              }
                              isPastEvent={past}
                            />
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  {futureMics.length > 0 ? (
                    <div>
                      <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Specific {weekdayName} mics
                      </h2>
                      <div className="space-y-3">
                        {sortedFutureMics.map((mic) => (
                          <MicCard
                            key={mic.id}
                            mic={mic}
                            dateQualifier={formatMicEventDateLabel(
                              mic,
                              todayYmd,
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </>
        ) : null}
      </main>

      <footer className="border-t border-zinc-200 px-4 py-6 text-center text-xs leading-relaxed text-zinc-400 dark:border-zinc-800 dark:text-zinc-500 md:px-8">
        <p>Put together by Vonne Aguda</p>
        <p className="mt-1">
          Using data from Erick Daniel&apos;s{' '}
          <a
            href={SHEET_SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-600 dark:decoration-zinc-600 dark:hover:text-zinc-400"
          >
            community sheet
          </a>
        </p>
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
