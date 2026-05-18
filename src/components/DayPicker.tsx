import { WEEKDAY_LABELS } from '../lib/torontoTime'

type Props = {
  selectedDay: number
  todayToronto: number
  onChange: (day: number) => void
}

export function DayPicker({ selectedDay, todayToronto, onChange }: Props) {
  return (
    <div>
      <label
        htmlFor="weekday-select"
        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
      >
        Day
      </label>
      <select
        id="weekday-select"
        value={selectedDay}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-zinc-900/20 bg-white py-2 pl-3 pr-8 text-sm font-medium text-zinc-800 shadow-sm dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
      >
        {WEEKDAY_LABELS.map(({ day, long }) => (
          <option key={day} value={day}>
            {long}
            {day === todayToronto ? ' (today)' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
