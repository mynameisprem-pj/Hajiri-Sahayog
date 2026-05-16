import { useEffect, useState } from 'react'
import { CalendarOff } from 'lucide-react'
import {
  PageHeader, StatCard, Card, EmptyState, StatusBadge,
} from '@/components/ui'
import { useSelectedStudent, useProfile, useAppStore, useHolidays } from '@/store/useAppStore'
import { attendanceOps } from '@/db/db'
import {
  formatDate, getUniqueMonths, formatMonthLabel,
  getWeeklyOffDaysInMonth, getBSMonthKey, formatBSMonthKey,
  isWeeklyOffDay, todayAD,
  currentMonthPrefix,
} from '@/utils/dateConverter'
import type { AttendanceHistoryEntry } from '@/types'

// ─── Upcoming Holidays Section ────────────────────────────────────────────────

interface UpcomingHolidaysSectionProps {
  weeklyOffDays: number[]
  system: 'BS' | 'AD'
}

function UpcomingHolidaysSection({ weeklyOffDays, system }: UpcomingHolidaysSectionProps) {
  const holidays = useHolidays()
  const today = todayAD()

  const futureOneTime = holidays
    .filter(h => h.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  const futureRecurring: { date: string; label: string }[] = []
  if (weeklyOffDays.length > 0) {
    const cursor = new Date()
    cursor.setDate(cursor.getDate() + 1)
    const limit = new Date()
    limit.setDate(limit.getDate() + 60)
    while (cursor <= limit && futureRecurring.length < 5) {
      const dateStr = cursor.toISOString().split('T')[0]
      const dow = cursor.getDay()
      if (weeklyOffDays.includes(dow) && !holidays.some(h => h.date === dateStr)) {
        const dayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow]
        futureRecurring.push({ date: dateStr, label: `Weekly Off — ${dayName}` })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  const allUpcoming = [
    ...futureOneTime.map(h => ({ date: h.date, label: h.name, isOneTime: true })),
    ...futureRecurring.map(r => ({ date: r.date, label: r.label, isOneTime: false })),
  ].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)

  if (allUpcoming.length === 0) return null

  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Upcoming Holidays
      </p>
      <Card padding="none">
        {allUpcoming.map((item, idx) => (
          <div key={item.date}>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-holiday-light flex items-center justify-center shrink-0">
                <CalendarOff size={16} className="text-holiday" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{item.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.date, system)}</p>
              </div>
              {!item.isOneTime && (
                <span className="text-xs text-holiday bg-holiday-light font-medium px-2 py-0.5 rounded-full shrink-0">
                  Recurring
                </span>
              )}
            </div>
            {idx < allUpcoming.length - 1 && <div className="border-t border-slate-50 mx-4" />}
          </div>
        ))}
      </Card>
      <p className="text-xs text-slate-400 mt-2 px-1">
        These are scheduled — attendance stats only reflect past days.
      </p>
    </div>
  )
}

// ─── Student Profile Page ─────────────────────────────────────────────────────

interface StudentProfilePageProps {
  onBack: () => void
}

export function StudentProfilePage({ onBack }: StudentProfilePageProps) {
  const student = useSelectedStudent()
  const profile = useProfile()
  const holidays = useHolidays()
  const selectStudent = useAppStore(s => s.selectStudent)

  const system = profile?.dateSystem ?? 'AD'
  const weeklyOffDays = profile?.weeklyOffDays ?? []
  const today = todayAD()

  const [allHistory, setAllHistory] = useState<AttendanceHistoryEntry[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [filtered, setFiltered] = useState<AttendanceHistoryEntry[]>([])
  const [overallStats, setOverallStats] = useState({ present: 0, absent: 0, leave: 0, holiday: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student?.id) return
    setLoading(true)

    attendanceOps.getByStudent(student.id).then(records => {
      // All past records
      const pastRecords = records.filter(r => r.date <= today)

      // DB map — DB always wins over generated entries
      const dbMap = new Map(pastRecords.map(r => [r.date, r]))

      // ── Find the earliest attendance date ever recorded ──────────────────
      // Recurring holidays and one-time holidays only count FROM this date.
      // Before this date, no attendance was being tracked so holidays are irrelevant.
      const firstAttendanceDate = pastRecords.length > 0
        ? pastRecords.reduce((min, r) => r.date < min ? r.date : min, pastRecords[0].date)
        : null

      // Months that have real records (for month filter pills)
      const monthsWithRecords = getUniqueMonths(pastRecords.map(r => r.date))
      const allMonths = [...new Set([...monthsWithRecords, currentMonthPrefix()])]
        .sort((a, b) => b.localeCompare(a))

      const generatedEntries: AttendanceHistoryEntry[] = []

      if (firstAttendanceDate) {
        // ── Recurring weekly off days ──────────────────────────────────────
        // Only from firstAttendanceDate to today, only in months with records
        for (const month of monthsWithRecords) {
          const offDays = getWeeklyOffDaysInMonth(month, weeklyOffDays)
          for (const date of offDays) {
            if (
              date >= firstAttendanceDate && // on or after first attendance
              date <= today &&               // not future
              !dbMap.has(date)               // no DB record
            ) {
              generatedEntries.push({ date, status: 'holiday' })
            }
          }
        }

        // ── One-time holidays ──────────────────────────────────────────────
        // Only from firstAttendanceDate to today, only in months with records
        for (const holiday of holidays) {
          if (
            holiday.date >= firstAttendanceDate && // on or after first attendance
            holiday.date <= today &&               // not future
            holiday.date.slice(0, 7) &&            // has a month prefix
            monthsWithRecords.includes(holiday.date.slice(0, 7)) && // month has records
            !dbMap.has(holiday.date)               // no DB record
          ) {
            generatedEntries.push({ date: holiday.date, status: 'holiday' })
          }
        }
      }

      // DB entries
      const dbEntries: AttendanceHistoryEntry[] = pastRecords.map(r => ({
        date: r.date,
        status: r.status,
        note: r.note,
      }))

      // Merge and sort newest first
      const merged = [...dbEntries, ...generatedEntries]
        .sort((a, b) => b.date.localeCompare(a.date))

      setAllHistory(merged)
      setAvailableMonths(allMonths)

      // Stats
      const stats = { present: 0, absent: 0, leave: 0, holiday: 0 }
      for (const entry of merged) stats[entry.status]++
      setOverallStats(stats)

      setLoading(false)
    })
  }, [student?.id, weeklyOffDays.join(','), holidays.length])

  useEffect(() => {
    if (selectedMonth === 'all') {
      setFiltered(allHistory)
    } else if (system === 'BS') {
      // selectedMonth is a BS key "YYYY-MM" in BS
      // Compare each history entry's BS month key against selected
      setFiltered(allHistory.filter(h => getBSMonthKey(h.date) === selectedMonth))
    } else {
      // AD mode — selectedMonth is a standard AD "YYYY-MM" prefix, simple startsWith
      setFiltered(allHistory.filter(h => h.date.startsWith(selectedMonth)))
    }
  }, [allHistory, selectedMonth, system])

  useEffect(() => {
    if (student?.id) selectStudent(student.id)
  }, [])

  if (!student) return null

  const totalNonHoliday = overallStats.present + overallStats.absent + overallStats.leave
  const pct = totalNonHoliday > 0 ? Math.round((overallStats.present / totalNonHoliday) * 100) : 0
  const pctColor = pct >= 85 ? 'text-present-dark' : pct >= 75 ? 'text-leave-dark' : 'text-absent-dark'
  const totalDays = overallStats.present + overallStats.absent + overallStats.leave + overallStats.holiday

  const monthSummary = {
    present: filtered.filter(h => h.status === 'present').length,
    absent:  filtered.filter(h => h.status === 'absent').length,
    leave:   filtered.filter(h => h.status === 'leave').length,
    holiday: filtered.filter(h => h.status === 'holiday').length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">
      <PageHeader title={student.name} subtitle={`Roll No. ${student.rollNo}`} onBack={onBack} />

      <div className="px-4 flex flex-col gap-5">

        {/* Overall Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Summary</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Attendance</span>
              <span className={`text-sm font-bold ${pctColor}`}>{pct}%</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Present" value={overallStats.present} color="green"  />
            <StatCard label="Absent"  value={overallStats.absent}  color="red"    />
            <StatCard label="Leave"   value={overallStats.leave}   color="yellow" />
            <StatCard label="Holiday" value={overallStats.holiday} color="purple" />
          </div>

          {totalDays > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden flex">
                <div className="h-full bg-present transition-all duration-700" style={{ width: `${(overallStats.present / totalDays) * 100}%` }} />
                <div className="h-full bg-absent transition-all duration-700"  style={{ width: `${(overallStats.absent  / totalDays) * 100}%` }} />
                <div className="h-full bg-leave transition-all duration-700"   style={{ width: `${(overallStats.leave   / totalDays) * 100}%` }} />
                <div className="h-full bg-holiday transition-all duration-700" style={{ width: `${(overallStats.holiday / totalDays) * 100}%` }} />
              </div>
              <span className="text-xs text-slate-400 shrink-0">{totalDays} days</span>
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Attendance History
          </p>

          {availableMonths.length > 0 && (
            <div className="mb-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {/* All option */}
                <button
                  onClick={() => setSelectedMonth('all')}
                  className={`
                    shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                    transition-all duration-150 active:scale-95
                    ${selectedMonth === 'all'
                      ? 'bg-primary-600 text-white shadow-soft'
                      : 'bg-surface-tertiary text-slate-600 hover:bg-slate-200'
                    }
                  `}
                >
                  All
                </button>
                {/* Month pills */}
                {(() => {
                  if (system === 'BS') {
                    // Build unique BS month keys from all history entries
                    // Key = "BSYYYY-MM", label = "Baisakh 2083"
                    const seen = new Set<string>()
                    return allHistory
                      .map(h => getBSMonthKey(h.date))
                      .filter(key => {
                        if (seen.has(key)) return false
                        seen.add(key)
                        return true
                      })
                      .sort((a, b) => b.localeCompare(a)) // newest first
                      .map(bsKey => (
                        <button
                          key={bsKey}
                          onClick={() => setSelectedMonth(bsKey)}
                          className={`
                            shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                            transition-all duration-150 active:scale-95
                            ${selectedMonth === bsKey
                              ? 'bg-primary-600 text-white shadow-soft'
                              : 'bg-surface-tertiary text-slate-600 hover:bg-slate-200'
                            }
                          `}
                        >
                          {formatBSMonthKey(bsKey)}
                        </button>
                      ))
                  } else {
                    // AD mode — use AD month prefixes directly
                    return availableMonths.map(adPrefix => (
                      <button
                        key={adPrefix}
                        onClick={() => setSelectedMonth(adPrefix)}
                        className={`
                          shrink-0 px-3 py-1.5 rounded-full text-xs font-medium
                          transition-all duration-150 active:scale-95
                          ${selectedMonth === adPrefix
                            ? 'bg-primary-600 text-white shadow-soft'
                            : 'bg-surface-tertiary text-slate-600 hover:bg-slate-200'
                          }
                        `}
                      >
                        {formatMonthLabel(adPrefix, 'AD')}
                      </button>
                    ))
                  }
                })()}
              </div>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'P', value: monthSummary.present, bg: 'bg-present-light', text: 'text-present-dark' },
                { label: 'A', value: monthSummary.absent,  bg: 'bg-absent-light',  text: 'text-absent-dark'  },
                { label: 'L', value: monthSummary.leave,   bg: 'bg-leave-light',   text: 'text-leave-dark'   },
                { label: 'H', value: monthSummary.holiday, bg: 'bg-holiday-light', text: 'text-holiday-dark' },
              ].map(({ label, value, bg, text }) => (
                <div key={label} className={`${bg} rounded-xl p-2.5 text-center`}>
                  <p className={`text-lg font-bold ${text}`}>{value}</p>
                  <p className={`text-xs ${text} font-medium`}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {loading ? (
            <Card padding="md">
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </Card>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No records this month"
              description={availableMonths.length === 0
                ? "Attendance hasn't been marked yet"
                : "Select a different month to view history"
              }
            />
          ) : (
            <Card padding="none">
              {filtered.map((entry, idx) => (
                <div key={entry.date}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">
                        {formatDate(entry.date, system)}
                      </p>
                      {entry.status === 'holiday' && !entry.note && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {isWeeklyOffDay(entry.date, weeklyOffDays) ? 'Weekly Off' : 'Holiday'}
                        </p>
                      )}
                      {entry.note && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">{entry.note}</p>
                      )}
                    </div>
                    <StatusBadge status={entry.status} size="md" />
                  </div>
                  {idx < filtered.length - 1 && <div className="border-t border-slate-50 mx-4" />}
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* Upcoming Holidays */}
        <UpcomingHolidaysSection weeklyOffDays={weeklyOffDays} system={system} />

      </div>
    </div>
  )
}