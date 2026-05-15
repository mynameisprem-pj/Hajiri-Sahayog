// ─── Date System ─────────────────────────────────────────────────────────────

export type DateSystem = 'BS' | 'AD'

// A normalized date string always stored as AD (YYYY-MM-DD) in the DB
// Display is converted based on user preference
export type DateString = string // format: "YYYY-MM-DD" in AD always

// ─── Attendance Status ────────────────────────────────────────────────────────

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'holiday'

// ─── Week Days ───────────────────────────────────────────────────────────────

// 0 = Sunday, 1 = Monday, ..., 6 = Saturday (matches JS Date.getDay())
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const WEEK_DAYS: { day: WeekDay; label: string; short: string }[] = [
  { day: 0, label: 'Sunday',    short: 'Sun' },
  { day: 1, label: 'Monday',    short: 'Mon' },
  { day: 2, label: 'Tuesday',   short: 'Tue' },
  { day: 3, label: 'Wednesday', short: 'Wed' },
  { day: 4, label: 'Thursday',  short: 'Thu' },
  { day: 5, label: 'Friday',    short: 'Fri' },
  { day: 6, label: 'Saturday',  short: 'Sat' },
]

// ─── Profile ──────────────────────────────────────────────────────────────────

export interface Profile {
  id: 1 // singleton row, always id=1
  name: string
  schoolName: string
  dateSystem: DateSystem
  disclaimerAccepted: boolean
  createdAt: DateString
  weeklyOffDays: WeekDay[] // e.g. [0] = every Sunday off, [0,6] = Sun+Sat
}

// ─── Class ───────────────────────────────────────────────────────────────────

export interface Class {
  id?: number          // auto-incremented by Dexie
  name: string
  createdAt: DateString
}

// Class with extra computed fields (not stored in DB)
export interface ClassWithStats extends Class {
  studentCount: number
  todayStatus: 'marked' | 'holiday' | 'pending'
}

// ─── Student ──────────────────────────────────────────────────────────────────

export interface Student {
  id?: number          // auto-incremented by Dexie
  classId: number
  rollNo: number
  name: string
  createdAt: DateString
}

// Student with computed attendance summary (not stored in DB)
export interface StudentWithStats extends Student {
  totalPresent: number
  totalAbsent: number
  totalLeave: number
  totalHoliday: number
  totalDays: number
  attendancePercentage: number // based on present / (present + absent + leave)
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface Attendance {
  id?: number          // auto-incremented by Dexie
  studentId: number
  classId: number
  date: DateString     // always stored as AD "YYYY-MM-DD"
  status: AttendanceStatus
  note?: string        // optional per-student note
}

// One day's attendance summary for a class
export interface DayAttendanceSummary {
  date: DateString
  totalStudents: number
  present: number
  absent: number
  leave: number
  holiday: number
  unmarked: number
}

// Student attendance for a specific day (used in mark attendance screen)
export interface StudentAttendanceRow {
  student: Student
  status: AttendanceStatus | null // null = not yet marked
}

// ─── Holiday ─────────────────────────────────────────────────────────────────

export interface Holiday {
  id?: number          // auto-incremented by Dexie
  date: DateString     // always stored as AD "YYYY-MM-DD"
  name: string
  createdAt: DateString
}

// ─── Attendance History (for student profile) ─────────────────────────────────

export interface AttendanceHistoryEntry {
  date: DateString
  status: AttendanceStatus
  note?: string
}

// Grouped by month for the history view
export interface MonthlyAttendanceGroup {
  monthLabel: string   // e.g. "Baisakh 2081" or "January 2025"
  monthKey: string     // e.g. "2025-01" for sorting
  entries: AttendanceHistoryEntry[]
  summary: {
    present: number
    absent: number
    leave: number
    holiday: number
  }
}

// ─── Backup / Export ─────────────────────────────────────────────────────────

export interface BackupData {
  version: string           // app version at time of export e.g. "1.0.0"
  exportedAt: string        // ISO datetime string
  profile: Profile
  classes: Class[]
  students: Student[]
  attendance: Attendance[]
  holidays: Holiday[]
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootTab = 'dashboard' | 'classes' | 'holidays' | 'settings'

// ─── UI State ────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
  duration?: number         // ms, default 3000
}

// ─── Voice Input ─────────────────────────────────────────────────────────────

export type VoiceInputState = 'idle' | 'listening' | 'processing' | 'error'

// ─── BS Month Names ──────────────────────────────────────────────────────────

export const BS_MONTHS = [
  'Baisakh',
  'Jestha',
  'Ashadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const

export type BSMonth = typeof BS_MONTHS[number]

export const AD_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

export type ADMonth = typeof AD_MONTHS[number]

// ─── Attendance Status Config (for UI rendering) ──────────────────────────────

export interface StatusConfig {
  label: string
  shortLabel: string
  bgColor: string
  textColor: string
  borderColor: string
  lightBg: string
}

export const ATTENDANCE_STATUS_CONFIG: Record<AttendanceStatus, StatusConfig> = {
  present: {
    label: 'Present',
    shortLabel: 'P',
    bgColor: 'bg-present',
    textColor: 'text-present-dark',
    borderColor: 'border-present',
    lightBg: 'bg-present-light',
  },
  absent: {
    label: 'Absent',
    shortLabel: 'A',
    bgColor: 'bg-absent',
    textColor: 'text-absent-dark',
    borderColor: 'border-absent',
    lightBg: 'bg-absent-light',
  },
  leave: {
    label: 'Leave',
    shortLabel: 'L',
    bgColor: 'bg-leave',
    textColor: 'text-leave-dark',
    borderColor: 'border-leave',
    lightBg: 'bg-leave-light',
  },
  holiday: {
    label: 'Holiday',
    shortLabel: 'H',
    bgColor: 'bg-holiday',
    textColor: 'text-holiday-dark',
    borderColor: 'border-holiday',
    lightBg: 'bg-holiday-light',
  },
}

// ─── App Constants ────────────────────────────────────────────────────────────

export const APP_VERSION = '1.0.0'
export const APP_NAME = 'Hajiri Sahayog'
export const DEVELOPER_NAME = 'Prem Jha'
export const DEVELOPER_EMAIL = 'premjha1714@gmail.com'
export const DISCLAIMER_TEXT =
  'All your data is stored only on this device. Hajiri Sahayog does not upload or back up your data to any server. If your device is lost, damaged, reset, or the browser data is cleared, your attendance data will be permanently lost. The developer holds no responsibility for any data loss. It is strongly recommended to regularly export your data from Settings and keep it in a safe place.'