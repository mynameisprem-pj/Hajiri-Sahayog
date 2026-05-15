import { create } from 'zustand'
import { profileOps, classOps, studentOps, attendanceOps, holidayOps, backupOps } from '@/db/db'
import { isWeeklyOffDay } from '@/utils/dateConverter'
import type {
  Profile,
  Class,
  ClassWithStats,
  Student,
  StudentWithStats,
  Attendance,
  Holiday,
  ToastMessage,
  DateSystem,
  AttendanceStatus,
  WeekDay,
} from '@/types'

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AppState {
  // ── App Init ──────────────────────────────────────────────────────────────
  isInitialized: boolean
  isLoading: boolean

  // ── Profile ───────────────────────────────────────────────────────────────
  profile: Profile | null

  // ── Classes ───────────────────────────────────────────────────────────────
  classes: Class[]
  classesWithStats: ClassWithStats[]

  // ── Selected Class (for ClassDetail / MarkAttendance screens) ─────────────
  selectedClassId: number | null
  selectedClass: Class | null
  studentsInClass: Student[]

  // ── Selected Student (for StudentProfile screen) ───────────────────────────
  selectedStudentId: number | null
  selectedStudent: StudentWithStats | null

  // ── Attendance ────────────────────────────────────────────────────────────
  // Today's attendance for the selected class
  todayAttendance: Attendance[]
  // Currently viewed date in MarkAttendance (defaults to today)
  attendanceDate: string // AD YYYY-MM-DD

  // ── Holidays ──────────────────────────────────────────────────────────────
  holidays: Holiday[]
  todayIsHoliday: boolean
  todayHolidayName: string

  // ── UI ────────────────────────────────────────────────────────────────────
  toasts: ToastMessage[]
  activeTab: 'dashboard' | 'classes' | 'holidays' | 'settings'

  // ─── Actions ──────────────────────────────────────────────────────────────

  // Init
  initialize: () => Promise<void>

  // Profile
  saveProfile: (data: Omit<Profile, 'id' | 'createdAt'>) => Promise<void>
  updateProfile: (data: Partial<Omit<Profile, 'id'>>) => Promise<void>
  setDateSystem: (system: DateSystem) => Promise<void>
  setWeeklyOffDays: (days: WeekDay[]) => Promise<void>

  // Classes
  loadClasses: () => Promise<void>
  addClass: (name: string) => Promise<number>
  updateClass: (id: number, name: string) => Promise<void>
  deleteClass: (id: number) => Promise<void>
  selectClass: (classId: number) => Promise<void>
  clearSelectedClass: () => void

  // Students
  loadStudentsForClass: (classId: number) => Promise<void>
  addStudent: (classId: number, rollNo: number, name: string) => Promise<void>
  updateStudent: (id: number, data: Partial<Pick<Student, 'name' | 'rollNo'>>) => Promise<void>
  deleteStudent: (id: number) => Promise<void>
  bulkAddStudents: (classId: number, students: Array<{ rollNo: number; name: string }>) => Promise<void>
  selectStudent: (studentId: number) => Promise<void>
  clearSelectedStudent: () => void

  // Attendance
  setAttendanceDate: (date: string) => Promise<void>
  loadAttendanceForDate: (classId: number, date: string) => Promise<void>
  markAttendance: (studentId: number, classId: number, date: string, status: AttendanceStatus) => Promise<void>
  markAllPresent: (classId: number, date: string) => Promise<void>

  // Holidays
  loadHolidays: () => Promise<void>
  addHoliday: (date: string, name: string) => Promise<void>
  deleteHoliday: (id: number) => Promise<void>
  checkTodayHoliday: () => Promise<void>

  // Backup
  exportData: () => Promise<void>
  importData: (file: File) => Promise<void>
  resetApp: () => Promise<void>

  // Toast
  showToast: (type: ToastMessage['type'], message: string, duration?: number) => void
  dismissToast: (id: string) => void

  // Navigation
  setActiveTab: (tab: AppState['activeTab']) => void
}

// ─── Today's date helper ──────────────────────────────────────────────────────

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 9)
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set, get) => ({
  // ── Initial State ─────────────────────────────────────────────────────────
  isInitialized: false,
  isLoading: false,
  profile: null,
  classes: [],
  classesWithStats: [],
  selectedClassId: null,
  selectedClass: null,
  studentsInClass: [],
  selectedStudentId: null,
  selectedStudent: null,
  todayAttendance: [],
  attendanceDate: todayString(),
  holidays: [],
  todayIsHoliday: false,
  todayHolidayName: '',
  toasts: [],
  activeTab: 'dashboard',

  // ── Initialize ────────────────────────────────────────────────────────────
  initialize: async () => {
    set({ isLoading: true })
    try {
      const profile = await profileOps.get()
      const holidays = await holidayOps.getAll()
      const today = todayString()
      const todayHoliday = holidays.find(h => h.date === today)

      set({
        profile: profile ?? null,
        holidays,
        todayIsHoliday: !!todayHoliday,
        todayHolidayName: todayHoliday?.name ?? '',
        isInitialized: true,
        isLoading: false,
      })

      if (profile) {
        await get().loadClasses()
      }
    } catch (err) {
      console.error('Init error:', err)
      set({ isInitialized: true, isLoading: false })
    }
  },

  // ── Profile ───────────────────────────────────────────────────────────────
  saveProfile: async (data) => {
    const today = todayString()
    await profileOps.save({ ...data, disclaimerAccepted: true, createdAt: today })
    const profile = await profileOps.get()
    set({ profile: profile ?? null })
    await get().loadClasses()
  },

  updateProfile: async (data) => {
    await profileOps.update(data)
    const profile = await profileOps.get()
    set({ profile: profile ?? null })
  },

  setDateSystem: async (system) => {
    await profileOps.update({ dateSystem: system })
    const profile = await profileOps.get()
    set({ profile: profile ?? null })
  },

  setWeeklyOffDays: async (days) => {
    await profileOps.update({ weeklyOffDays: days })
    const profile = await profileOps.get()
    set({ profile: profile ?? null })
    await get().loadClasses()
  },

  // ── Classes ───────────────────────────────────────────────────────────────
  loadClasses: async () => {
    const classes = await classOps.getAll()
    const today = todayString()
    const { holidays } = get()
    const todayHoliday = holidays.find(h => h.date === today)
    const profile = await profileOps.get()
    const weeklyOffDays = profile?.weeklyOffDays ?? []
    const todayIsWeeklyOff = isWeeklyOffDay(today, weeklyOffDays)

    const classesWithStats: ClassWithStats[] = await Promise.all(
      classes.map(async (cls) => {
        const studentCount = await studentOps.countByClass(cls.id!)
        let todayStatus: ClassWithStats['todayStatus'] = 'pending'

        if (todayHoliday || todayIsWeeklyOff) {
          todayStatus = 'holiday'
        } else {
          const isMarked = await attendanceOps.isMarkedForClass(cls.id!, today)
          todayStatus = isMarked ? 'marked' : 'pending'
        }

        return { ...cls, studentCount, todayStatus }
      })
    )

    set({ classes, classesWithStats })
  },

  addClass: async (name) => {
    const id = await classOps.add(name)
    await get().loadClasses()
    get().showToast('success', `Class "${name}" added`)
    return id
  },

  updateClass: async (id, name) => {
    await classOps.update(id, name)
    await get().loadClasses()

    // Update selectedClass if it's the one being edited
    if (get().selectedClassId === id) {
      const updated = await classOps.getById(id)
      set({ selectedClass: updated ?? null })
    }
    get().showToast('success', 'Class updated')
  },

  deleteClass: async (id) => {
    const cls = get().classes.find(c => c.id === id)
    await classOps.delete(id)
    await get().loadClasses()
    get().showToast('success', `Class "${cls?.name}" deleted`)
  },

  selectClass: async (classId) => {
    const cls = await classOps.getById(classId)
    if (!cls) return
    set({
      selectedClassId: classId,
      selectedClass: cls,
      attendanceDate: todayString(),
    })
    await get().loadStudentsForClass(classId)
    await get().loadAttendanceForDate(classId, todayString())
  },

  clearSelectedClass: () => {
    set({
      selectedClassId: null,
      selectedClass: null,
      studentsInClass: [],
      todayAttendance: [],
    })
  },

  // ── Students ──────────────────────────────────────────────────────────────
  loadStudentsForClass: async (classId) => {
    const students = await studentOps.getByClass(classId)
    set({ studentsInClass: students })
  },

  addStudent: async (classId, rollNo, name) => {
    await studentOps.add(classId, rollNo, name)
    await get().loadStudentsForClass(classId)
    await get().loadClasses()
    get().showToast('success', `${name} added`)
  },

  updateStudent: async (id, data) => {
    await studentOps.update(id, data)
    const { selectedClassId } = get()
    if (selectedClassId) await get().loadStudentsForClass(selectedClassId)

    // Refresh selected student stats if viewing their profile
    if (get().selectedStudentId === id) {
      await get().selectStudent(id)
    }
    get().showToast('success', 'Student updated')
  },

  deleteStudent: async (id) => {
    const student = get().studentsInClass.find(s => s.id === id)
    await studentOps.delete(id)
    const { selectedClassId } = get()
    if (selectedClassId) {
      await get().loadStudentsForClass(selectedClassId)
      await get().loadAttendanceForDate(selectedClassId, get().attendanceDate)
      await get().loadClasses()
    }
    get().showToast('success', `${student?.name ?? 'Student'} removed`)
  },

  bulkAddStudents: async (classId, students) => {
    await studentOps.bulkAdd(classId, students)
    await get().loadStudentsForClass(classId)
    await get().loadClasses()
    get().showToast('success', `${students.length} students imported`)
  },

  selectStudent: async (studentId) => {
    const student = await studentOps.getById(studentId)
    if (!student) return

    const summary = await attendanceOps.getSummaryByStudent(studentId)
    const attendancePct =
      summary.present + summary.absent + summary.leave > 0
        ? Math.round(
            (summary.present / (summary.present + summary.absent + summary.leave)) * 100
          )
        : 0

    const studentWithStats: StudentWithStats = {
      ...student,
      totalPresent: summary.present,
      totalAbsent: summary.absent,
      totalLeave: summary.leave,
      totalHoliday: summary.holiday,
      totalDays: summary.total,
      attendancePercentage: attendancePct,
    }

    set({ selectedStudentId: studentId, selectedStudent: studentWithStats })
  },

  clearSelectedStudent: () => {
    set({ selectedStudentId: null, selectedStudent: null })
  },

  // ── Attendance ────────────────────────────────────────────────────────────
  setAttendanceDate: async (date) => {
    set({ attendanceDate: date })
    const { selectedClassId } = get()
    if (selectedClassId) {
      await get().loadAttendanceForDate(selectedClassId, date)
    }
  },

  loadAttendanceForDate: async (classId, date) => {
    const records = await attendanceOps.getByClassAndDate(classId, date)
    set({ todayAttendance: records })
  },

  markAttendance: async (studentId, classId, date, status) => {
    await attendanceOps.mark(studentId, classId, date, status)
    await get().loadAttendanceForDate(classId, date)

    // Refresh selected student stats if their profile is open
    if (get().selectedStudentId === studentId) {
      await get().selectStudent(studentId)
    }
  },

  markAllPresent: async (classId, date) => {
    const students = get().studentsInClass
    const records = students.map(s => ({
      studentId: s.id!,
      classId,
      date,
      status: 'present' as AttendanceStatus,
    }))
    await attendanceOps.bulkMark(records)
    await get().loadAttendanceForDate(classId, date)
    get().showToast('success', 'All students marked present')
  },

  // ── Holidays ──────────────────────────────────────────────────────────────
  loadHolidays: async () => {
    const holidays = await holidayOps.getAll()
    const today = todayString()
    const todayHoliday = holidays.find(h => h.date === today)
    set({
      holidays,
      todayIsHoliday: !!todayHoliday,
      todayHolidayName: todayHoliday?.name ?? '',
    })
  },

  addHoliday: async (date, name) => {
    await holidayOps.add(date, name)
    await get().loadHolidays()
    await get().loadClasses()
    get().showToast('success', `Holiday "${name}" added`)
  },

  deleteHoliday: async (id) => {
    const holiday = get().holidays.find(h => h.id === id)
    await holidayOps.delete(id)
    await get().loadHolidays()
    await get().loadClasses()
    get().showToast('success', `Holiday "${holiday?.name}" removed`)
  },

  checkTodayHoliday: async () => {
    const today = todayString()
    const holiday = await holidayOps.getByDate(today)
    set({
      todayIsHoliday: !!holiday,
      todayHolidayName: holiday?.name ?? '',
    })
  },

  // ── Backup ────────────────────────────────────────────────────────────────
  exportData: async () => {
    try {
      const data = await backupOps.exportAll()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().split('T')[0]
      a.href = url
      a.download = `hajiri-sahayog-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      get().showToast('success', 'Backup exported successfully')
    } catch (err) {
      console.error('Export error:', err)
      get().showToast('error', 'Export failed. Please try again.')
    }
  },

  importData: async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Basic validation
      if (!data.version || !data.profile) {
        throw new Error('Invalid backup file')
      }

      await backupOps.importAll(data)
      await get().initialize()
      get().showToast('success', 'Data imported successfully')
    } catch (err) {
      console.error('Import error:', err)
      get().showToast('error', 'Import failed. Please check the file and try again.')
    }
  },

  resetApp: async () => {
    try {
      await backupOps.resetAll()
      set({
        profile: null,
        classes: [],
        classesWithStats: [],
        selectedClassId: null,
        selectedClass: null,
        studentsInClass: [],
        selectedStudentId: null,
        selectedStudent: null,
        todayAttendance: [],
        holidays: [],
        todayIsHoliday: false,
        todayHolidayName: '',
        activeTab: 'dashboard',
      })
      get().showToast('success', 'App reset successfully')
    } catch (err) {
      console.error('Reset error:', err)
      get().showToast('error', 'Reset failed. Please try again.')
    }
  },

  // ── Toast ─────────────────────────────────────────────────────────────────
  showToast: (type, message, duration = 3000) => {
    const id = generateId()
    set(state => ({
      toasts: [...state.toasts, { id, type, message, duration }],
    }))
    setTimeout(() => {
      get().dismissToast(id)
    }, duration)
  },

  dismissToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }))
  },

  // ── Navigation ────────────────────────────────────────────────────────────
  setActiveTab: (tab) => {
    set({ activeTab: tab })
  },
}))

// ─── Selector Hooks (for clean component usage) ───────────────────────────────

export const useProfile = () => useAppStore(s => s.profile)
export const useClasses = () => useAppStore(s => s.classesWithStats)
export const useSelectedClass = () => useAppStore(s => s.selectedClass)
export const useStudentsInClass = () => useAppStore(s => s.studentsInClass)
export const useSelectedStudent = () => useAppStore(s => s.selectedStudent)
export const useTodayAttendance = () => useAppStore(s => s.todayAttendance)
export const useAttendanceDate = () => useAppStore(s => s.attendanceDate)
export const useHolidays = () => useAppStore(s => s.holidays)
export const useTodayIsHoliday = () => useAppStore(s => s.todayIsHoliday)
export const useToasts = () => useAppStore(s => s.toasts)
export const useActiveTab = () => useAppStore(s => s.activeTab)
export const useIsInitialized = () => useAppStore(s => s.isInitialized)
export const useIsLoading = () => useAppStore(s => s.isLoading)