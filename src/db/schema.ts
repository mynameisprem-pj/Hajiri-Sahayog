import Dexie from 'dexie'
import type {
  Profile,
  Class,
  Student,
  Attendance,
  Holiday,
} from '@/types'

// ─── Table Type Map ───────────────────────────────────────────────────────────
// This file documents the exact Dexie table → TypeScript type mapping.
// The actual Dexie instance is in db.ts — import from there, not here.

export type ProfileTable   = Dexie.Table<Profile,    number>
export type ClassTable     = Dexie.Table<Class,      number>
export type StudentTable   = Dexie.Table<Student,    number>
export type AttendanceTable = Dexie.Table<Attendance, number>
export type HolidayTable   = Dexie.Table<Holiday,    number>

// ─── Index Reference ──────────────────────────────────────────────────────────
// Documenting all indexes defined in db.ts for quick reference.
//
// profile
//   pk:  id (always 1, singleton)
//
// classes
//   pk:  ++id
//   idx: name, createdAt
//
// students
//   pk:  ++id
//   idx: classId, rollNo, name
//   cmp: [classId+rollNo]  → unique roll number per class lookup
//
// attendance
//   pk:  ++id
//   idx: studentId, classId, date, status
//   cmp: [studentId+date]  → single student on a date
//   cmp: [classId+date]    → full class on a date
//
// holidays
//   pk:  ++id
//   idx: date, name

// ─── Validation Helpers ───────────────────────────────────────────────────────

/** Validates that a backup JSON object has the required top-level shape */
export function isValidBackup(data: unknown): data is {
  version: string
  exportedAt: string
  profile: Profile
  classes: Class[]
  students: Student[]
  attendance: Attendance[]
  holidays: Holiday[]
} {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>

  return (
    typeof d.version === 'string' &&
    typeof d.exportedAt === 'string' &&
    typeof d.profile === 'object' && d.profile !== null &&
    Array.isArray(d.classes) &&
    Array.isArray(d.students) &&
    Array.isArray(d.attendance) &&
    Array.isArray(d.holidays)
  )
}

/** Validates a student row from CSV bulk import */
export function isValidStudentRow(row: unknown): row is { rollNo: number; name: string } {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return (
    (typeof r.rollNo === 'number' || typeof r.rollNo === 'string') &&
    typeof r.name === 'string' &&
    r.name.trim().length > 0
  )
}