import { useState } from 'react'
import { Plus, CalendarOff, Trash2 } from 'lucide-react'
import {
  PageHeader, Button, Card, EmptyState,
  BottomSheet, Input, ConfirmDialog, DatePicker,
} from '@/components/ui'
import { useHolidays, useAppStore, useProfile } from '@/store/useAppStore'
import { formatDate, todayAD } from '@/utils/dateConverter'
import { WEEK_DAYS } from '@/types'
import type { Holiday, WeekDay } from '@/types'

// ─── Weekly Off Days Picker ───────────────────────────────────────────────────

function WeeklyOffDaysPicker() {
  const profile = useProfile()
  const setWeeklyOffDays = useAppStore(s => s.setWeeklyOffDays)
  const weeklyOffDays = profile?.weeklyOffDays ?? []

  const toggle = async (day: WeekDay) => {
    const updated: WeekDay[] = weeklyOffDays.includes(day)
      ? weeklyOffDays.filter(d => d !== day)
      : [...weeklyOffDays, day]
    await setWeeklyOffDays(updated)
  }

  return (
    <Card padding="md">
      <div className="mb-3">
        <p className="text-sm font-semibold text-slate-800">Weekly Off Days</p>
        <p className="text-xs text-slate-400 mt-0.5">
          These days are automatically treated as holidays every week
        </p>
      </div>

      {/* Day Pills */}
      <div className="flex gap-2 flex-wrap">
        {WEEK_DAYS.map(({ day, short }) => {
          const isSelected = weeklyOffDays.includes(day)
          return (
            <button
              key={day}
              onClick={() => toggle(day)}
              className={`
                px-3 py-2 rounded-xl text-xs font-semibold
                transition-all duration-150 active:scale-95 min-w-[44px]
                ${isSelected
                  ? 'bg-holiday text-white shadow-soft'
                  : 'bg-surface-tertiary text-slate-500 hover:bg-slate-200'
                }
              `}
            >
              {short}
            </button>
          )
        })}
      </div>

      {/* Summary */}
      {weeklyOffDays.length > 0 ? (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-holiday-dark font-medium">
            🗓️ Every{' '}
            {weeklyOffDays
              .sort((a, b) => a - b)
              .map(d => WEEK_DAYS.find(w => w.day === d)?.label)
              .join(' & ')
            }{' '}
            is a holiday
          </p>
        </div>
      ) : (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-400">No weekly off days selected</p>
        </div>
      )}
    </Card>
  )
}

// ─── Holiday Row ──────────────────────────────────────────────────────────────

interface HolidayRowProps {
  holiday: Holiday
  system: 'BS' | 'AD'
  isToday: boolean
  isPast?: boolean
  onDelete: () => void
}

function HolidayRow({ holiday, system, isToday, isPast = false, onDelete }: HolidayRowProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`
        w-10 h-10 rounded-xl flex items-center justify-center shrink-0
        ${isPast ? 'bg-slate-100' : 'bg-holiday-light'}
      `}>
        <CalendarOff size={18} className={isPast ? 'text-slate-400' : 'text-holiday'} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${isPast ? 'text-slate-500' : 'text-slate-800'}`}>
            {holiday.name}
          </p>
          {isToday && (
            <span className="shrink-0 text-xs font-semibold text-holiday bg-holiday-light
                             px-2 py-0.5 rounded-full">
              Today
            </span>
          )}
        </div>
        <p className={`text-xs mt-0.5 ${isPast ? 'text-slate-400' : 'text-slate-500'}`}>
          {formatDate(holiday.date, system)}
        </p>
      </div>

      <button
        onClick={onDelete}
        className="p-2 rounded-xl text-slate-300 hover:text-absent hover:bg-absent-light
                   transition-all active:scale-90 shrink-0"
        aria-label="Delete holiday"
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

// ─── Holidays Page ────────────────────────────────────────────────────────────

export function HolidaysPage() {
  const holidays = useHolidays()
  const profile = useProfile()
  const addHoliday = useAppStore(s => s.addHoliday)
  const deleteHoliday = useAppStore(s => s.deleteHoliday)

  const system = profile?.dateSystem ?? 'AD'
  const today = todayAD()

  const [addOpen, setAddOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null)
  const [holidayName, setHolidayName] = useState('')
  const [holidayDate, setHolidayDate] = useState(today)
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const upcoming = holidays
    .filter(h => h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date))

  const past = holidays
    .filter(h => h.date < today)
    .sort((a, b) => b.date.localeCompare(a.date))

  const openAdd = () => {
    setHolidayName('')
    setHolidayDate(today)
    setNameError('')
    setAddOpen(true)
  }

  const handleSave = async () => {
    if (!holidayName.trim()) {
      setNameError('Holiday name is required')
      return
    }
    if (!holidayDate) {
      setNameError('Please select a date')
      return
    }
    const exists = holidays.some(h => h.date === holidayDate)
    if (exists) {
      setNameError('A holiday already exists on this date')
      return
    }
    setSaving(true)
    try {
      await addHoliday(holidayDate, holidayName)
      setAddOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await deleteHoliday(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">
      <PageHeader
        title="Holidays"
        subtitle={`${holidays.length} one-time holiday${holidays.length !== 1 ? 's' : ''}`}
        action={
          <Button size="sm" icon={<Plus size={16} />} onClick={openAdd}>
            Add
          </Button>
        }
      />

      <div className="px-4 flex flex-col gap-5">

        {/* ── Weekly Off Days ────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Recurring
          </p>
          <WeeklyOffDaysPicker />
        </div>

        {/* ── One-Time Holidays ─────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            One-Time Holidays
          </p>

          {holidays.length === 0 ? (
            <EmptyState
              icon={<CalendarOff size={28} />}
              title="No one-time holidays added"
              description="Add specific dates like festivals, exam days, or special occasions"
              action={
                <Button icon={<Plus size={16} />} onClick={openAdd}>
                  Add Holiday
                </Button>
              }
            />
          ) : (
            <>
              {upcoming.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-400 font-medium mb-2 px-1">Upcoming</p>
                  <Card padding="none">
                    {upcoming.map((holiday, idx) => (
                      <div key={holiday.id}>
                        <HolidayRow
                          holiday={holiday}
                          system={system}
                          isToday={holiday.date === today}
                          onDelete={() => setDeleteTarget(holiday)}
                        />
                        {idx < upcoming.length - 1 && (
                          <div className="border-t border-slate-50 mx-4" />
                        )}
                      </div>
                    ))}
                  </Card>
                </div>
              )}

              {past.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 font-medium mb-2 px-1">Past</p>
                  <Card padding="none">
                    {past.map((holiday, idx) => (
                      <div key={holiday.id}>
                        <HolidayRow
                          holiday={holiday}
                          system={system}
                          isToday={false}
                          isPast
                          onDelete={() => setDeleteTarget(holiday)}
                        />
                        {idx < past.length - 1 && (
                          <div className="border-t border-slate-50 mx-4" />
                        )}
                      </div>
                    ))}
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Add Holiday Sheet ──────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add One-Time Holiday"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              Add Holiday
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Holiday Name"
            placeholder="e.g. Buddha Jayanti, Dashain, etc."
            value={holidayName}
            onChange={e => {
              setHolidayName(e.target.value)
              setNameError('')
            }}
            error={nameError}
            autoFocus
          />
          <DatePicker
            label="Date"
            value={holidayDate}
            onChange={setHolidayDate}
          />
          <div className="bg-holiday-light rounded-2xl px-4 py-3">
            <p className="text-xs text-holiday-dark font-medium">
              📌 This holiday will be automatically applied to all students across all classes.
            </p>
          </div>
        </div>
      </BottomSheet>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Holiday"
        message={`Remove "${deleteTarget?.name}"? The holiday attendance will be removed from all students.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </div>
  )
}