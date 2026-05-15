import { useEffect, useRef, useState } from 'react'
import { WEEKDAY_LABELS } from '../lib/torontoTime'

/**
 * Short solid band (covers main horizontal padding where pills can peek through) +
 * soft fade — mostly transparent so pills are not washed out.
 */
const FADE_LIGHT =
  'linear-gradient(to left, rgb(250, 250, 250) 0px, rgb(250, 250, 250) 22px, rgba(250, 250, 250, 0.2) 52px, rgba(250, 250, 250, 0) 100%)'
const FADE_DARK =
  'linear-gradient(to left, rgb(9, 9, 11) 0px, rgb(9, 9, 11) 22px, rgba(9, 9, 11, 0.22) 52px, rgba(9, 9, 11, 0) 100%)'

type Props = {
  selectedDay: number
  todayToronto: number
  onChange: (day: number) => void
}

export function DayPicker({ selectedDay, todayToronto, onChange }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showRightFade, setShowRightFade] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const update = () => {
      const { scrollLeft, scrollWidth, clientWidth } = el
      const overflow = scrollWidth > clientWidth + 2
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 2
      setShowRightFade(overflow && !atEnd)
    }

    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  return (
    <div className="relative isolate">
      <div
        ref={scrollRef}
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
      {/* Bleed into main px-4 / md:px-8 so nothing shows past the fade at the screen edge */}
      <div
        className={[
          'pointer-events-none absolute inset-y-0 -right-4 z-20 w-[5.75rem] transition-opacity duration-200 md:-right-8 md:w-[6.5rem]',
          showRightFade ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        aria-hidden
      >
        <div
          className="absolute inset-0 dark:hidden"
          style={{ background: FADE_LIGHT }}
        />
        <div
          className="absolute inset-0 hidden dark:block"
          style={{ background: FADE_DARK }}
        />
      </div>
    </div>
  )
}
