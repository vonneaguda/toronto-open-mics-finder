import { WEEKDAY_LABELS } from '../lib/torontoTime'

type Props = {
  selectedDay: number
  todayToronto: number
  onChange: (day: number) => void
}

export function DayPicker({ selectedDay, todayToronto, onChange }: Props) {
  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              'shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition',
              active
                ? 'border-transparent bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-50'
                : 'border-zinc-900/25 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900',
            ].join(' ')}
          >
            <span className="md:hidden">
              {short}
              {isToday ? ' (today)' : ''}
            </span>
            <span className="hidden md:inline">
              {long}
              {isToday ? ' (today)' : ''}
            </span>
          </button>
        )
      })}
    </div>
  )
}
