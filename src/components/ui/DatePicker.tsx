import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useProfile } from '@/store/useAppStore'
import {
  todayAD,
  formatDate,
  adToBSPicker,
  bsPickerToAD,
  getDaysInBSMonth,
  getBSYearRange,
} from '@/utils/dateConverter'
import { BS_MONTHS } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface DatePickerProps {
  value: string        // AD date string YYYY-MM-DD
  onChange: (adDate: string) => void
  maxDate?: string     // AD date string — disables future dates
  minDate?: string     // AD date string — disables past dates
  label?: string
  className?: string
}

// ─── AD Date Picker ───────────────────────────────────────────────────────────

function ADDatePicker({ value, onChange, maxDate, minDate }: DatePickerProps) {
  return (
    <div className="relative">
      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
      <input
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        max={maxDate}
        min={minDate}
        className="
          w-full pl-9 pr-3 py-2.5 rounded-xl
          bg-surface-tertiary border border-transparent
          text-sm text-slate-800
          focus:outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100
          transition-all duration-200
        "
      />
    </div>
  )
}

// ─── BS Date Picker ───────────────────────────────────────────────────────────

function BSDatePicker({ value, onChange, maxDate, minDate }: DatePickerProps) {
  const bs = adToBSPicker(value || todayAD())
  const [year, setYear] = useState(bs.year)
  const [month, setMonth] = useState(bs.month)
  const [day, setDay] = useState(bs.day)

  // Sync internal state when external value changes
  useEffect(() => {
    if (value) {
      const parsed = adToBSPicker(value)
      setYear(parsed.year)
      setMonth(parsed.month)
      setDay(parsed.day)
    }
  }, [value])

  const years = getBSYearRange()
  const daysInMonth = getDaysInBSMonth(year, month)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const handleChange = (y: number, m: number, d: number) => {
    const clampedDay = Math.min(d, getDaysInBSMonth(y, m))
    try {
      const adDate = bsPickerToAD(y, m, clampedDay)
      if (maxDate && adDate > maxDate) return
      if (minDate && adDate < minDate) return
      setYear(y)
      setMonth(m)
      setDay(clampedDay)
      onChange(adDate)
    } catch {
      // Invalid BS date — ignore
    }
  }

  const selectClass = `
    flex-1 px-2 py-2.5 rounded-xl bg-surface-tertiary border border-transparent
    text-sm text-slate-800 text-center
    focus:outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100
    transition-all duration-200 appearance-none cursor-pointer
  `

  return (
    <div className="flex gap-2">
      {/* Day */}
      <select
        value={day}
        onChange={e => handleChange(year, month, parseInt(e.target.value))}
        className={selectClass}
        aria-label="Day"
      >
        {days.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Month */}
      <select
        value={month}
        onChange={e => handleChange(year, parseInt(e.target.value), day)}
        className={`${selectClass} flex-[2]`}
        aria-label="Month"
      >
        {BS_MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>{name}</option>
        ))}
      </select>

      {/* Year */}
      <select
        value={year}
        onChange={e => handleChange(parseInt(e.target.value), month, day)}
        className={selectClass}
        aria-label="Year"
      >
        {years.map(y => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}

// ─── Unified DatePicker ───────────────────────────────────────────────────────

export function DatePicker({ value, onChange, maxDate, minDate, label, className = '' }: DatePickerProps) {
  const profile = useProfile()
  const system = profile?.dateSystem ?? 'AD'

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      {system === 'BS' ? (
        <BSDatePicker value={value} onChange={onChange} maxDate={maxDate} minDate={minDate} />
      ) : (
        <ADDatePicker value={value} onChange={onChange} maxDate={maxDate} minDate={minDate} />
      )}
    </div>
  )
}

// ─── Date Navigator ───────────────────────────────────────────────────────────
// Used in the Mark Attendance screen to navigate between dates

interface DateNavigatorProps {
  date: string           // AD date string
  onChange: (date: string) => void
  disableFuture?: boolean
}

export function DateNavigator({ date, onChange, disableFuture = true }: DateNavigatorProps) {
  const profile = useProfile()
  const system = profile?.dateSystem ?? 'AD'
  const today = todayAD()
  const isToday = date === today
//   const isFuture = date > today

  const move = (days: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    const next = d.toISOString().split('T')[0]
    if (disableFuture && next > today) return
    onChange(next)
  }

  const goToToday = () => onChange(today)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => move(-1)}
        className="p-2 rounded-xl bg-surface-tertiary hover:bg-slate-200
                   active:scale-95 transition-all duration-150 text-slate-600"
        aria-label="Previous day"
      >
        <ChevronLeft size={18} />
      </button>

      <button
        onClick={goToToday}
        className={`
          flex-1 py-2 px-3 rounded-xl text-sm font-medium text-center
          transition-all duration-150 active:scale-[0.98]
          ${isToday
            ? 'bg-primary-600 text-white'
            : 'bg-surface-tertiary text-slate-700 hover:bg-slate-200'
          }
        `}
      >
        {isToday ? 'Today' : formatDate(date, system)}
      </button>

      <button
        onClick={() => move(1)}
        disabled={disableFuture && isToday}
        className="p-2 rounded-xl bg-surface-tertiary hover:bg-slate-200
                   active:scale-95 transition-all duration-150 text-slate-600
                   disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100"
        aria-label="Next day"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

// ─── Month Selector ───────────────────────────────────────────────────────────
// Horizontal scrollable month pills for student history filter

interface MonthSelectorProps {
  months: string[]          // YYYY-MM prefixes available
  selected: string          // currently selected YYYY-MM
  onSelect: (month: string) => void
  formatLabel: (month: string) => string
}

export function MonthSelector({ months, selected, onSelect, formatLabel }: MonthSelectorProps) {
  if (months.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {months.map(m => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className={`
            shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
            transition-all duration-150 active:scale-95
            ${selected === m
              ? 'bg-primary-600 text-white shadow-soft'
              : 'bg-surface-tertiary text-slate-600 hover:bg-slate-200'
            }
          `}
        >
          {formatLabel(m)}
        </button>
      ))}
    </div>
  )
}