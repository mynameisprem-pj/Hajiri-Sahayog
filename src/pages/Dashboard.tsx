import { useEffect } from 'react'
import { BookOpen, Users, CalendarOff, CheckCircle, Clock, Sun, Moon, Sunset } from 'lucide-react'
import {
  Card, StatCard, Badge, EmptyState, SectionLabel, Button
} from '@/components/ui'
import {
  useProfile, useClasses, useHolidays,
  useAppStore, useTodayIsHoliday,
} from '@/store/useAppStore'
import { formatToday, formatDate } from '@/utils/dateConverter'
import type { ClassWithStats } from '@/types'

// ─── Greeting ─────────────────────────────────────────────────────────────────

function getGreeting(): { text: string; Icon: typeof Sun } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good Morning', Icon: Sun }
  if (hour < 17) return { text: 'Good Afternoon', Icon: Sunset }
  return { text: 'Good Evening', Icon: Moon }
}

// ─── Class Card ───────────────────────────────────────────────────────────────

interface ClassCardProps {
  cls: ClassWithStats
  onSelect: () => void
}

function ClassCard({ cls, onSelect }: ClassCardProps) {
  const statusConfig = {
    marked: {
      label: 'Marked',
      color: 'bg-present-light text-present-dark',
      icon: <CheckCircle size={12} />,
    },
    pending: {
      label: 'Pending',
      color: 'bg-leave-light text-leave-dark',
      icon: <Clock size={12} />,
    },
    holiday: {
      label: 'Holiday',
      color: 'bg-holiday-light text-holiday-dark',
      icon: <CalendarOff size={12} />,
    },
  }

  const status = statusConfig[cls.todayStatus]

  return (
    <Card pressable onClick={onSelect} padding="none">
      <div className="flex items-center gap-3 p-4">
        {/* Class Icon */}
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <BookOpen size={20} className="text-primary-600" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 truncate">{cls.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Users size={12} className="text-slate-400" />
            <p className="text-xs text-slate-500">{cls.studentCount} students</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`
          inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
          shrink-0 ${status.color}
        `}>
          {status.icon}
          {status.label}
        </span>
      </div>
    </Card>
  )
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

interface DashboardPageProps {
  onSelectClass: (classId: number) => void
  onGoToClasses: () => void
  onGoToHolidays: () => void
}

export function DashboardPage({ onSelectClass, onGoToClasses, onGoToHolidays }: DashboardPageProps) {
  const profile = useProfile()
  const classes = useClasses()
  const holidays = useHolidays()
  const todayIsHoliday = useTodayIsHoliday()
  const todayHolidayName = useAppStore(s => s.todayHolidayName)
  const loadClasses = useAppStore(s => s.loadClasses)

  const system = profile?.dateSystem ?? 'AD'
  const { text: greeting, Icon: GreetIcon } = getGreeting()

  const markedCount  = classes.filter(c => c.todayStatus === 'marked').length
  const pendingCount = classes.filter(c => c.todayStatus === 'pending').length
  const totalStudents = classes.reduce((sum, c) => sum + c.studentCount, 0)

  // Upcoming holidays (next 3)
  const today = new Date().toISOString().split('T')[0]
  const upcoming = holidays.filter(h => h.date >= today).slice(0, 3)

  useEffect(() => {
    loadClasses()
  }, [loadClasses])

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">

      {/* ── Header Banner ─────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 px-5 pt-12 pb-6">
        {/* Greeting */}
        <div className="flex items-center gap-2 mb-1">
          <GreetIcon size={18} className="text-primary-200" />
          <span className="text-primary-200 text-sm font-medium">{greeting}</span>
        </div>
        <h1 className="text-white text-2xl font-bold mb-0.5">
          {profile?.name?.split(' ')[0]} Teacher
        </h1>
        <p className="text-primary-200 text-sm">{profile?.schoolName}</p>

        {/* Today's Date */}
        <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3">
          <p className="text-primary-100 text-xs font-medium mb-0.5">Today</p>
          <p className="text-white font-semibold text-base">
            {formatToday(system)}
          </p>
          {todayIsHoliday && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <CalendarOff size={13} className="text-holiday-light" />
              <p className="text-holiday-light text-xs font-medium">{todayHolidayName}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 -mt-3 flex flex-col gap-5">

        {/* ── Today's Overview ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="Classes"
            value={classes.length}
            color="blue"
            icon={<BookOpen size={16} />}
          />
          <StatCard
            label="Students"
            value={totalStudents}
            color="green"
            icon={<Users size={16} />}
          />
          <StatCard
            label="Holidays"
            value={holidays.length}
            color="purple"
            icon={<CalendarOff size={16} />}
          />
        </div>

        {/* ── Attendance Status ────────────────────────────────────────────── */}
        {!todayIsHoliday && classes.length > 0 && (
          <Card padding="md">
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Today's Attendance
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-surface-tertiary rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-present rounded-full transition-all duration-500"
                  style={{ width: `${classes.length > 0 ? (markedCount / classes.length) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-600 shrink-0">
                {markedCount}/{classes.length} marked
              </span>
            </div>
            {pendingCount > 0 && (
              <p className="text-xs text-leave-dark mt-2 font-medium">
                ⏳ {pendingCount} class{pendingCount > 1 ? 'es' : ''} still pending
              </p>
            )}
            {pendingCount === 0 && markedCount > 0 && (
              <p className="text-xs text-present-dark mt-2 font-medium">
                ✅ All attendance marked for today!
              </p>
            )}
          </Card>
        )}

        {todayIsHoliday && (
          <Card padding="md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-holiday-light flex items-center justify-center">
                <CalendarOff size={18} className="text-holiday" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Today is a Holiday</p>
                <p className="text-xs text-slate-500 mt-0.5">{todayHolidayName}</p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Classes ─────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel
            action={
              classes.length > 0 ? (
                <button
                  onClick={onGoToClasses}
                  className="text-xs font-semibold text-primary-600 active:text-primary-800"
                >
                  See All
                </button>
              ) : undefined
            }
          >
            My Classes
          </SectionLabel>

          {classes.length === 0 ? (
            <Card padding="md">
              <EmptyState
                icon={<BookOpen size={28} />}
                title="No classes yet"
                description="Add your first class to get started"
                action={
                  <Button size="sm" onClick={onGoToClasses}>
                    Add Class
                  </Button>
                }
              />
            </Card>
          ) : (
            <div className="flex flex-col gap-2.5">
              {classes.slice(0, 5).map(cls => (
                <ClassCard
                  key={cls.id}
                  cls={cls}
                  onSelect={() => onSelectClass(cls.id!)}
                />
              ))}
              {classes.length > 5 && (
                <button
                  onClick={onGoToClasses}
                  className="text-sm text-primary-600 font-medium text-center py-2
                             active:text-primary-800 transition-colors"
                >
                  +{classes.length - 5} more classes
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Upcoming Holidays ─────────────────────────────────────────────── */}
        {upcoming.length > 0 && (
          <div>
            <SectionLabel
              action={
                <button
                  onClick={onGoToHolidays}
                  className="text-xs font-semibold text-primary-600 active:text-primary-800"
                >
                  Manage
                </button>
              }
            >
              Upcoming Holidays
            </SectionLabel>
            <Card padding="none">
              {upcoming.map((holiday, idx) => (
                <div key={holiday.id}>
                  <div className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-xl bg-holiday-light flex items-center
                                    justify-center shrink-0">
                      <CalendarOff size={16} className="text-holiday" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{holiday.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(holiday.date, system)}
                      </p>
                    </div>
                    {holiday.date === today && (
                      <Badge color="purple" dot>Today</Badge>
                    )}
                  </div>
                  {idx < upcoming.length - 1 && (
                    <div className="border-t border-slate-50 mx-4" />
                  )}
                </div>
              ))}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}