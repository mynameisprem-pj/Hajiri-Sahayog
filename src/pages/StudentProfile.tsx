import { useEffect, useState } from 'react'
import { CalendarOff } from 'lucide-react'
import {
  PageHeader, StatCard, Card, EmptyState,
  StatusBadge, MonthSelector,
} from '@/components/ui'
import { useSelectedStudent, useProfile, useAppStore, useHolidays } from '@/store/useAppStore'
import { attendanceOps } from '@/db/db'
import {
  formatDate, formatMonthLabel, getUniqueMonths,
  currentMonthPrefix, getWeeklyOffDaysInMonth,
  isWeeklyOffDay, todayAD,
} from '@/utils/dateConverter'
import type { AttendanceHistoryEntry } from '@/types'

// ─── Upcoming Holidays Section ────────────────────────────────────────────────

interface UpcomingHolidaysProps {
  weeklyOffDays: number[]
  system: 'BS' | 'AD'
}

function UpcomingHolidaysSection({ weeklyOffDays, system }: UpcomingHolidaysProps) {
  const holidays = useHolidays()
  const today = todayAD()

  // Future one-time holidays
  const futureOneTime = holidays
    .filter(h => h.date > today)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5)

  // Next 5 upcoming recurring off days (next 60 days window)
  const futureRecurring: { date: string; label: string }[] = []
  if (weeklyOffDays.length > 0) {
    const cursor = new Date()
    cursor.setDate(cursor.getDate() + 1) // start from tomorrow
    const limit = new Date()
    limit.setDate(limit.getDate() + 60) // look 60 days ahead

    while (cursor <= limit && futureRecurring.length < 5) {
      const dateStr = cursor.toISOString().split('T')[0]
      const dow = cursor.getDay()
      if (
        weeklyOffDays.includes(dow) &&
        !holidays.some(h => h.date === dateStr) // not already a one-time holiday
      ) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday',
          'Thursday', 'Friday', 'Saturday'][dow]
        futureRecurring.push({ date: dateStr, label: `Weekly Off — ${dayName}` })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
  }

  // Merge and sort by date, limit to 6 total
  const allUpcoming = [
    ...futureOneTime.map(h => ({ date: h.date, label: h.name, isOneTime: true })),
    ...futureRecurring.map(r => ({ date: r.date, label: r.label, isOneTime: false })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6)

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
              <div className="w-9 h-9 rounded-xl bg-holiday-light flex items-center
                              justify-center shrink-0">
                <CalendarOff size={16} className="text-holiday" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(item.date, system)}
                </p>
              </div>
              {!item.isOneTime && (
                <span className="text-xs text-holiday bg-holiday-light font-medium
                                 px-2 py-0.5 rounded-full shrink-0">
                  Recurring
                </span>
              )}
            </div>
            {idx < allUpcoming.length - 1 && (
              <div className="border-t border-slate-50 mx-4" />
            )}
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
  const selectStudent = useAppStore(s => s.selectStudent)

  const system = profile?.dateSystem ?? 'AD'
  const weeklyOffDays = profile?.weeklyOffDays ?? []
  const today = todayAD()

  const [allHistory, setAllHistory] = useState<AttendanceHistoryEntry[]>([])
  const [availableMonths, setAvailableMonths] = useState<string[]>([])
  const [selectedMonth, setSelectedMonth] = useState(currentMonthPrefix())
  const [filtered, setFiltered] = useState<AttendanceHistoryEntry[]>([])
  const [overallStats, setOverallStats] = useState({
    present: 0, absent: 0, leave: 0, holiday: 0,
  })
  const [loading, setLoading] = useState(true)

  // ── Load history ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!student?.id) return
    setLoading(true)

    attendanceOps.getByStudent(student.id).then(records => {
      // Only consider past records (today and before)
      const pastRecords = records.filter(r => r.date <= today)

      // Map of date → DB record for fast lookup
      const dbMap = new Map(pastRecords.map(r => [r.date, r]))

      // Months that have any past DB record
      const dbMonths = getUniqueMonths(pastRecords.map(r => r.date))

      // Include current month even if no records yet
      const allMonths = [...new Set([...dbMonths, currentMonthPrefix()])]
        .sort((a, b) => b.localeCompare(a))

      // Generate recurring off-day entries for past dates with no DB record
      const recurringEntries: AttendanceHistoryEntry[] = []
      for (const month of allMonths) {
        const offDays = getWeeklyOffDaysInMonth(month, weeklyOffDays)
        for (const date of offDays) {
          // Only past/today, and only if no DB record exists
          if (date <= today && !dbMap.has(date)) {
            recurringEntries.push({ date, status: 'holiday' })
          }
        }
      }

      // DB entries (past only)
      const dbEntries: AttendanceHistoryEntry[] = pastRecords.map(r => ({
        date: r.date,
        status: r.status,
        note: r.note,
      }))

      // Merge and sort newest first
      const merged = [...dbEntries, ...recurringEntries]
        .sort((a, b) => b.date.localeCompare(a.date))

      setAllHistory(merged)
      setAvailableMonths(allMonths)

      // Overall stats — past days only
      const stats = { present: 0, absent: 0, leave: 0, holiday: 0 }
      for (const entry of merged) {
        stats[entry.status]++
      }
      setOverallStats(stats)

      // Default to most recent month with data
      if (allMonths.length > 0 && !allMonths.includes(selectedMonth)) {
        setSelectedMonth(allMonths[0])
      }

      setLoading(false)
    })
  }, [student?.id, weeklyOffDays.join(',')])

  // ── Filter by selected month ───────────────────────────────────────────────
  useEffect(() => {
    setFiltered(allHistory.filter(h => h.date.startsWith(selectedMonth)))
  }, [allHistory, selectedMonth])

  // ── Refresh stats on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (student?.id) selectStudent(student.id)
  }, [])

  if (!student) return null

  const totalNonHoliday = overallStats.present + overallStats.absent + overallStats.leave
  const pct = totalNonHoliday > 0
    ? Math.round((overallStats.present / totalNonHoliday) * 100)
    : 0
  const pctColor =
    pct >= 85 ? 'text-present-dark' :
    pct >= 75 ? 'text-leave-dark' :
                'text-absent-dark'
  const totalDays =
    overallStats.present + overallStats.absent +
    overallStats.leave + overallStats.holiday

  // Monthly summary for selected month
  const monthSummary = {
    present: filtered.filter(h => h.status === 'present').length,
    absent:  filtered.filter(h => h.status === 'absent').length,
    leave:   filtered.filter(h => h.status === 'leave').length,
    holiday: filtered.filter(h => h.status === 'holiday').length,
  }

  // Is the selected month in the future?
  const isFutureMonth = selectedMonth > currentMonthPrefix()

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">
      <PageHeader
        title={student.name}
        subtitle={`Roll No. ${student.rollNo}`}
        onBack={onBack}
      />

      <div className="px-4 flex flex-col gap-5">

        {/* ── Overall Stats (past days only) ─────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overall Summary
            </p>
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

          {/* Stacked bar */}
          {totalDays > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-present transition-all duration-700"
                  style={{ width: `${(overallStats.present / totalDays) * 100}%` }}
                />
                <div
                  className="h-full bg-absent transition-all duration-700"
                  style={{ width: `${(overallStats.absent / totalDays) * 100}%` }}
                />
                <div
                  className="h-full bg-leave transition-all duration-700"
                  style={{ width: `${(overallStats.leave / totalDays) * 100}%` }}
                />
                <div
                  className="h-full bg-holiday transition-all duration-700"
                  style={{ width: `${(overallStats.holiday / totalDays) * 100}%` }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">{totalDays} days</span>
            </div>
          )}
        </div>

        {/* ── Attendance History ─────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Attendance History
          </p>

          {/* Month Filter — past months only */}
          {availableMonths.length > 0 && (
            <div className="mb-4">
              <MonthSelector
                months={availableMonths}
                selected={selectedMonth}
                onSelect={setSelectedMonth}
                formatLabel={m => formatMonthLabel(m, system)}
              />
            </div>
          )}

          {/* Monthly mini stats */}
          {!isFutureMonth && filtered.length > 0 && (
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

          {/* History list */}
          {loading ? (
            <Card padding="md">
              <div className="flex items-center justify-center py-8">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary-300 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </Card>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="📅"
              title="No records this month"
              description={
                availableMonths.length === 0
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
                          {isWeeklyOffDay(entry.date, weeklyOffDays)
                            ? 'Weekly Off'
                            : 'Holiday'
                          }
                        </p>
                      )}
                      {entry.note && (
                        <p className="text-xs text-slate-400 mt-0.5 truncate">
                          {entry.note}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={entry.status} size="md" />
                  </div>
                  {idx < filtered.length - 1 && (
                    <div className="border-t border-slate-50 mx-4" />
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>

        {/* ── Upcoming Holidays (future, separate from history) ──────────── */}
        <UpcomingHolidaysSection
          weeklyOffDays={weeklyOffDays}
          system={system}
        />

      </div>
    </div>
  )
}