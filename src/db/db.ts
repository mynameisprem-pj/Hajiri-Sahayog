import Dexie, { type Table } from 'dexie'
import type {
  Profile,
  Class,
  Student,
  Attendance,
  Holiday,
} from '@/types'

// ─── Database Class ───────────────────────────────────────────────────────────

class HajiriDatabase extends Dexie {
  profile!: Table<Profile, number>
  classes!: Table<Class, number>
  students!: Table<Student, number>
  attendance!: Table<Attendance, number>
  holidays!: Table<Holiday, number>

  constructor() {
    super('HajiriSahayogDB')

    this.version(1).stores({
      // Profile: singleton, id is always 1
      profile: 'id',

      // Classes: auto-increment id, indexed by name
      classes: '++id, name, createdAt',

      // Students: auto-increment id, indexed by classId and rollNo
      // Compound index [classId+rollNo] ensures unique roll numbers per class
      students: '++id, classId, rollNo, name, [classId+rollNo]',

      // Attendance: auto-increment id
      // Compound index [studentId+date] for fast single-student lookups
      // Compound index [classId+date] for fast daily class attendance lookups
      attendance: '++id, studentId, classId, date, status, [studentId+date], [classId+date]',

      // Holidays: auto-increment id, indexed by date for fast lookup
      holidays: '++id, date, name',
    })
  }
}

// ─── Singleton DB Instance ────────────────────────────────────────────────────

export const db = new HajiriDatabase()

// ─── Profile Operations ───────────────────────────────────────────────────────

export const profileOps = {
  async get(): Promise<Profile | undefined> {
    return db.profile.get(1)
  },

  async save(data: Omit<Profile, 'id'>): Promise<void> {
    await db.profile.put({ ...data, id: 1, weeklyOffDays: data.weeklyOffDays ?? [] })
  },

  async updateWeeklyOffDays(days: number[]): Promise<void> {
    await db.profile.update(1, { weeklyOffDays: days })
  },

  async update(data: Partial<Omit<Profile, 'id'>>): Promise<void> {
    await db.profile.update(1, data)
  },

  async exists(): Promise<boolean> {
    const p = await db.profile.get(1)
    return !!p
  },
}

// ─── Class Operations ─────────────────────────────────────────────────────────

export const classOps = {
  async getAll(): Promise<Class[]> {
    return db.classes.orderBy('createdAt').toArray()
  },

  async getById(id: number): Promise<Class | undefined> {
    return db.classes.get(id)
  },

  async add(name: string): Promise<number> {
    return db.classes.add({
      name: name.trim(),
      createdAt: toDateString(new Date()),
    })
  },

  async update(id: number, name: string): Promise<void> {
    await db.classes.update(id, { name: name.trim() })
  },

  async delete(id: number): Promise<void> {
    // Cascade delete: remove all students and their attendance
    await db.transaction('rw', db.classes, db.students, db.attendance, async () => {
      const studentIds = await db.students
        .where('classId')
        .equals(id)
        .primaryKeys()

      if (studentIds.length > 0) {
        await db.attendance
          .where('studentId')
          .anyOf(studentIds)
          .delete()
      }

      await db.students.where('classId').equals(id).delete()
      await db.attendance.where('classId').equals(id).delete()
      await db.classes.delete(id)
    })
  },

  async count(): Promise<number> {
    return db.classes.count()
  },
}

// ─── Student Operations ───────────────────────────────────────────────────────

export const studentOps = {
  async getByClass(classId: number): Promise<Student[]> {
    return db.students
      .where('classId')
      .equals(classId)
      .sortBy('rollNo')
  },

  async getById(id: number): Promise<Student | undefined> {
    return db.students.get(id)
  },

  async getNextRollNo(classId: number): Promise<number> {
    const students = await db.students
      .where('classId')
      .equals(classId)
      .toArray()

    if (students.length === 0) return 1
    return Math.max(...students.map(s => s.rollNo)) + 1
  },

  async add(classId: number, rollNo: number, name: string): Promise<number> {
    return db.students.add({
      classId,
      rollNo,
      name: name.trim(),
      createdAt: toDateString(new Date()),
    })
  },

  async update(id: number, data: Partial<Pick<Student, 'name' | 'rollNo'>>): Promise<void> {
    await db.students.update(id, data)
  },

  async delete(id: number): Promise<void> {
    await db.transaction('rw', db.students, db.attendance, async () => {
      await db.attendance.where('studentId').equals(id).delete()
      await db.students.delete(id)
    })
  },

  async bulkAdd(classId: number, students: Array<{ rollNo: number; name: string }>): Promise<void> {
    const now = toDateString(new Date())
    const records: Student[] = students.map(s => ({
      classId,
      rollNo: s.rollNo,
      name: s.name.trim(),
      createdAt: now,
    }))
    await db.students.bulkAdd(records)
  },

  async countByClass(classId: number): Promise<number> {
    return db.students.where('classId').equals(classId).count()
  },

  async countAll(): Promise<number> {
    return db.students.count()
  },
}

// ─── Attendance Operations ────────────────────────────────────────────────────

export const attendanceOps = {
  // Get attendance for an entire class on a specific date
  async getByClassAndDate(classId: number, date: string): Promise<Attendance[]> {
    return db.attendance
      .where('[classId+date]')
      .equals([classId, date])
      .toArray()
  },

  // Get all attendance records for a student
  async getByStudent(studentId: number): Promise<Attendance[]> {
    return db.attendance
      .where('studentId')
      .equals(studentId)
      .sortBy('date')
  },

  // Get attendance for a student filtered by month (YYYY-MM prefix)
  async getByStudentAndMonth(studentId: number, monthPrefix: string): Promise<Attendance[]> {
    return db.attendance
      .where('studentId')
      .equals(studentId)
      .filter(a => a.date.startsWith(monthPrefix))
      .sortBy('date')
  },

  // Get a single attendance record for a student on a date
  async getByStudentAndDate(studentId: number, date: string): Promise<Attendance | undefined> {
    const results = await db.attendance
      .where('[studentId+date]')
      .equals([studentId, date])
      .first()
    return results
  },

  // Mark or update a single student's attendance
  async mark(
    studentId: number,
    classId: number,
    date: string,
    status: Attendance['status'],
    note?: string,
  ): Promise<void> {
    const existing = await attendanceOps.getByStudentAndDate(studentId, date)

    if (existing?.id !== undefined) {
      await db.attendance.update(existing.id, { status, note })
    } else {
      await db.attendance.add({ studentId, classId, date, status, note })
    }
  },

  // Bulk mark attendance for an entire class on a date
  async bulkMark(
    records: Array<{ studentId: number; classId: number; date: string; status: Attendance['status'] }>
  ): Promise<void> {
    await db.transaction('rw', db.attendance, async () => {
      for (const record of records) {
        const existing = await attendanceOps.getByStudentAndDate(record.studentId, record.date)
        if (existing?.id !== undefined) {
          await db.attendance.update(existing.id, { status: record.status })
        } else {
          await db.attendance.add(record)
        }
      }
    })
  },

  // Get attendance summary counts for a student
  async getSummaryByStudent(studentId: number): Promise<{
    present: number
    absent: number
    leave: number
    holiday: number
    total: number
  }> {
    const records = await db.attendance
      .where('studentId')
      .equals(studentId)
      .toArray()

    return {
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      leave: records.filter(r => r.status === 'leave').length,
      holiday: records.filter(r => r.status === 'holiday').length,
      total: records.length,
    }
  },

  // Check if attendance has been marked for a class on a date
  async isMarkedForClass(classId: number, date: string): Promise<boolean> {
    const count = await db.attendance
      .where('[classId+date]')
      .equals([classId, date])
      .count()
    return count > 0
  },

  // Get all dates attendance was marked for a class
  async getMarkedDates(classId: number): Promise<string[]> {
    const records = await db.attendance
      .where('classId')
      .equals(classId)
      .toArray()
    return [...new Set(records.map(r => r.date))].sort()
  },

  // Clear all attendance for a class on a specific date
  async clearByClassAndDate(classId: number, date: string): Promise<void> {
    await db.attendance
      .where('[classId+date]')
      .equals([classId, date])
      .delete()
  },

  // Apply holiday status to all students in all classes for a date
  async applyHolidayToAllClasses(date: string): Promise<void> {
    await db.transaction('rw', db.attendance, db.students, async () => {
      const allStudents = await db.students.toArray()

      for (const student of allStudents) {
        if (student.id === undefined) continue
        const existing = await attendanceOps.getByStudentAndDate(student.id, date)
        if (existing?.id !== undefined) {
          await db.attendance.update(existing.id, { status: 'holiday' })
        } else {
          await db.attendance.add({
            studentId: student.id,
            classId: student.classId,
            date,
            status: 'holiday',
          })
        }
      }
    })
  },

  // Remove holiday status from all students for a date (when holiday is deleted)
  async removeHolidayFromAllClasses(date: string): Promise<void> {
    await db.attendance
      .where('date')
      .equals(date)
      .filter(a => a.status === 'holiday')
      .delete()
  },
}

// ─── Holiday Operations ───────────────────────────────────────────────────────

export const holidayOps = {
  async getAll(): Promise<Holiday[]> {
    return db.holidays.orderBy('date').toArray()
  },

  async getByDate(date: string): Promise<Holiday | undefined> {
    return db.holidays.where('date').equals(date).first()
  },

  async isHoliday(date: string): Promise<boolean> {
    const h = await db.holidays.where('date').equals(date).count()
    return h > 0
  },

  async add(date: string, name: string): Promise<number> {
    const id = await db.holidays.add({
      date,
      name: name.trim(),
      createdAt: toDateString(new Date()),
    })
    // Auto-apply holiday attendance to all existing students
    await attendanceOps.applyHolidayToAllClasses(date)
    return id
  },

  async delete(id: number): Promise<void> {
    const holiday = await db.holidays.get(id)
    if (!holiday) return

    await db.transaction('rw', db.holidays, db.attendance, async () => {
      await attendanceOps.removeHolidayFromAllClasses(holiday.date)
      await db.holidays.delete(id)
    })
  },

  async getUpcoming(fromDate: string, limit = 3): Promise<Holiday[]> {
    return db.holidays
      .where('date')
      .aboveOrEqual(fromDate)
      .limit(limit)
      .toArray()
  },
}

// ─── Full Backup Operations ───────────────────────────────────────────────────

export const backupOps = {
  async exportAll() {
    const [profile, classes, students, attendance, holidays] = await Promise.all([
      db.profile.get(1),
      db.classes.toArray(),
      db.students.toArray(),
      db.attendance.toArray(),
      db.holidays.toArray(),
    ])

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile,
      classes,
      students,
      attendance,
      holidays,
    }
  },

  async importAll(data: {
    profile?: Profile
    classes?: Class[]
    students?: Student[]
    attendance?: Attendance[]
    holidays?: Holiday[]
  }): Promise<void> {
    await db.transaction(
      'rw',
      db.profile,
      db.classes,
      db.students,
      db.attendance,
      db.holidays,
      async () => {
        // Clear all existing data
        await Promise.all([
          db.profile.clear(),
          db.classes.clear(),
          db.students.clear(),
          db.attendance.clear(),
          db.holidays.clear(),
        ])

        // Restore from backup
        if (data.profile) await db.profile.put(data.profile)
        if (data.classes?.length) await db.classes.bulkAdd(data.classes)
        if (data.students?.length) await db.students.bulkAdd(data.students)
        if (data.attendance?.length) await db.attendance.bulkAdd(data.attendance)
        if (data.holidays?.length) await db.holidays.bulkAdd(data.holidays)
      }
    )
  },

  async resetAll(): Promise<void> {
    await db.transaction(
      'rw',
      db.profile,
      db.classes,
      db.students,
      db.attendance,
      db.holidays,
      async () => {
        await Promise.all([
          db.profile.clear(),
          db.classes.clear(),
          db.students.clear(),
          db.attendance.clear(),
          db.holidays.clear(),
        ])
      }
    )
  },
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  // Use local date parts to avoid UTC timezone shift (critical for Nepal UTC+5:45)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}