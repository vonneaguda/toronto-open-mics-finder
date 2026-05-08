import { WEEKDAY_LABELS } from '../lib/torontoTime'

type Props = {
  selectedDay: number
  todayToronto: number
  onChange: (day: number) => void
}

export function DayPicker({ selectedDay, todayToronto, onChange }: Props) {
  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center md:overflow-visible"
      role="tablist"
      aria-label="Weekday"
    >
      {WEEKDAY_LABELS.map(({ day, short, long }) => {
        const isToday = day === todayToronto
        const active = day === selectedDay
        return (
          <button
            key={day}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={long}
            onClick={() => onChange(day)}
            className={[
              'shrink-0 rounded-full px-4 py-2 text-sm font-medium transition',
              active
                ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20'
                : 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-600',
              isToday && !active
                ? 'ring-2 ring-violet-400 ring-offset-2 ring-offset-zinc-50 dark:ring-offset-zinc-900'
                : '',
            ].join(' ')}
          >
            <span className="md:hidden">{short}</span>
            <span className="hidden md:inline">{long}</span>
            {isToday ? (
              <span className="ml-1 text-xs opacity-80">• today</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
