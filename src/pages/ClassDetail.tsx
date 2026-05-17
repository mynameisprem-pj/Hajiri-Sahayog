import { useState, useCallback, useEffect } from 'react'
import {
  Plus, Upload, Users, CheckSquare,
  Trash2, MoreVertical, Pencil, ChevronRight, AlertCircle,
} from 'lucide-react'
import {
  PageHeader, Button, Card, EmptyState, BottomSheet,
  Input, VoiceInputField, ConfirmDialog, SearchBar,
  useSearch, AttendanceToggle, DateNavigator, Badge,
  StatusBadge,
} from '@/components/ui'
import {
  useAppStore, useSelectedClass, useStudentsInClass,
  useTodayAttendance, useAttendanceDate, useProfile,
  useTodayIsHoliday,
} from '@/store/useAppStore'
import { useVoiceInput } from '@/utils/voice'
import { parseStudentCSV, pickCSVFile, downloadSampleCSV, sanitizeName } from '@/utils/helpers'
import { todayAD, isWeeklyOffDay } from '@/utils/dateConverter'
import type { Student, AttendanceStatus } from '@/types'

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type Tab = 'students' | 'attendance'

// ─── Add Student Sheet ────────────────────────────────────────────────────────

interface AddStudentSheetProps {
  isOpen: boolean
  onClose: () => void
  classId: number
  nextRollNo: number
  existingRollNos: number[]
}

function AddStudentSheet({ isOpen, onClose, classId, nextRollNo, existingRollNos }: AddStudentSheetProps) {
  const [rollNo, setRollNo] = useState(String(nextRollNo))
  const [name, setName] = useState('')
  const [errors, setErrors] = useState<{ rollNo?: string; name?: string }>({})
  const [saving, setSaving] = useState(false)
  const addStudent = useAppStore(s => s.addStudent)

  // Sync rollNo when nextRollNo changes (new student added)
  const handleVoiceResult = useCallback((transcript: string) => {
    setName(sanitizeName(transcript))
    setErrors(p => ({ ...p, name: undefined }))
  }, [])

  const { state: voiceState, isSupported, start, stop } = useVoiceInput(handleVoiceResult)

  const validate = (currentRollNos: number[]) => {
    const e: typeof errors = {}
    const rn = parseInt(rollNo)
    if (!rollNo || isNaN(rn) || rn <= 0) {
      e.rollNo = 'Valid roll number required'
    } else if (currentRollNos.includes(rn)) {
      e.rollNo = `Roll No. ${rn} is already taken by another student`
    }
    if (!name.trim()) e.name = 'Student name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate(existingRollNos)) return
    setSaving(true)
    try {
      await addStudent(classId, parseInt(rollNo), name)
      // Move to next roll number, reset name
      setRollNo(String(parseInt(rollNo) + 1))
      setName('')
      setErrors({})
    } finally {
      setSaving(false)
    }
  }

  const handleSaveAndClose = async () => {
    if (!validate(existingRollNos)) return
    setSaving(true)
    try {
      await addStudent(classId, parseInt(rollNo), name)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Add Student"
      footer={
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2">
            <Button variant="secondary" fullWidth onClick={onClose}>
              Done
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              Save & Add Next
            </Button>
          </div>
          <Button variant="ghost" fullWidth onClick={handleSaveAndClose} disabled={saving}>
            Save & Close
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Roll No."
          type="number"
          inputMode="numeric"
          placeholder="1"
          value={rollNo}
          onChange={e => {
            setRollNo(e.target.value)
            setErrors(p => ({ ...p, rollNo: undefined }))
          }}
          error={errors.rollNo}
          min={1}
        />

        <VoiceInputField
          label="Student Name"
          placeholder="e.g. Ram Bahadur Sharma"
          value={name}
          onChange={e => {
            setName(e.target.value)
            setErrors(p => ({ ...p, name: undefined }))
          }}
          error={errors.name}
          voiceState={voiceState}
          onVoiceStart={start}
          onVoiceStop={stop}
          isVoiceSupported={isSupported}
          autoComplete="off"
        />

        <p className="text-xs text-slate-400 text-center">
          Tap "Save & Add Next" to quickly add multiple students
        </p>
      </div>
    </BottomSheet>
  )
}

// ─── Edit Student Sheet ───────────────────────────────────────────────────────

interface EditStudentSheetProps {
  student: Student | null
  onClose: () => void
  existingRollNos: number[]
}

function EditStudentSheet({ student, onClose, existingRollNos }: EditStudentSheetProps) {
  const [rollNo, setRollNo] = useState(String(student?.rollNo ?? ''))
  const [name, setName] = useState(student?.name ?? '')
  const [errors, setErrors] = useState<{ rollNo?: string; name?: string }>({})
  const [saving, setSaving] = useState(false)
  const updateStudent = useAppStore(s => s.updateStudent)

  // Reset form whenever the student prop changes (opening edit for a different student)
  useEffect(() => {
    setRollNo(String(student?.rollNo ?? ''))
    setName(student?.name ?? '')
    setErrors({})
  }, [student?.id])

  const validate = () => {
    const e: typeof errors = {}
    const rn = parseInt(rollNo)
    if (!rollNo || isNaN(rn) || rn <= 0) {
      e.rollNo = 'Valid roll number required'
    } else if (
      existingRollNos.includes(rn) &&
      rn !== student?.rollNo // allow keeping same roll no
    ) {
      e.rollNo = `Roll No. ${rn} is already taken by another student`
    }
    if (!name.trim()) e.name = 'Student name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!student?.id || !validate()) return
    setSaving(true)
    try {
      await updateStudent(student.id, {
        rollNo: parseInt(rollNo),
        name: name.trim(),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      isOpen={!!student}
      onClose={onClose}
      title="Edit Student"
      footer={
        <>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth loading={saving} onClick={handleSave}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Roll No."
          type="number"
          inputMode="numeric"
          placeholder="1"
          value={rollNo}
          onChange={e => {
            setRollNo(e.target.value)
            setErrors(p => ({ ...p, rollNo: undefined }))
          }}
          error={errors.rollNo}
          min={1}
          autoFocus
        />
        <Input
          label="Student Name"
          placeholder="e.g. Ram Bahadur Sharma"
          value={name}
          onChange={e => {
            setName(e.target.value)
            setErrors(p => ({ ...p, name: undefined }))
          }}
          error={errors.name}
        />
      </div>
    </BottomSheet>
  )
}

// ─── Bulk Import Sheet ────────────────────────────────────────────────────────

interface BulkImportSheetProps {
  isOpen: boolean
  onClose: () => void
  classId: number
  existingRollNos: number[]
}

function BulkImportSheet({ isOpen, onClose, classId, existingRollNos }: BulkImportSheetProps) {
  const [result, setResult] = useState<Awaited<ReturnType<typeof parseStudentCSV>> | null>(null)
  const [importing, setImporting] = useState(false)
  const bulkAddStudents = useAppStore(s => s.bulkAddStudents)

  const handlePickFile = async () => {
    const file = await pickCSVFile()
    if (!file) return
    const parsed = await parseStudentCSV(file)

    // Filter out roll numbers that already exist
    const conflicts = parsed.students.filter(s => existingRollNos.includes(s.rollNo))
    if (conflicts.length > 0) {
      conflicts.forEach(c => {
        parsed.errors.push(`Roll No. ${c.rollNo} already exists — skipped`)
      })
      parsed.students = parsed.students.filter(s => !existingRollNos.includes(s.rollNo))
      parsed.validRows = parsed.students.length
      parsed.success = parsed.students.length > 0
    }

    setResult(parsed)
  }

  const handleImport = async () => {
    if (!result?.students.length) return
    setImporting(true)
    try {
      await bulkAddStudents(classId, result.students)
      onClose()
      setResult(null)
    } finally {
      setImporting(false)
    }
  }

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={() => { onClose(); setResult(null) }}
      title="Bulk Import Students"
    >
      <div className="flex flex-col gap-4">
        <div className="bg-surface-tertiary rounded-2xl p-4">
          <p className="text-sm font-medium text-slate-700 mb-1">CSV Format Required</p>
          <p className="text-xs text-slate-500 font-mono bg-white rounded-xl px-3 py-2 mt-2">
            rollNo,name<br />
            1,Ram Bahadur Sharma<br />
            2,Sita Kumari Thapa
          </p>
        </div>

        <Button
          variant="secondary"
          fullWidth
          icon={<Upload size={16} />}
          onClick={downloadSampleCSV}
        >
          Download Sample CSV
        </Button>

        <Button fullWidth icon={<Upload size={16} />} onClick={handlePickFile}>
          Pick CSV File
        </Button>

        {result && (
          <div className="flex flex-col gap-3">
            <div className={`rounded-2xl p-4 ${result.success ? 'bg-present-light' : 'bg-absent-light'}`}>
              <p className={`text-sm font-semibold ${result.success ? 'text-present-dark' : 'text-absent-dark'}`}>
                {result.success
                  ? `✅ ${result.validRows} of ${result.totalRows} rows ready to import`
                  : `❌ No valid rows found`
                }
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-leave-light rounded-2xl p-4 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-leave-dark mb-1.5">
                  <AlertCircle size={12} className="inline mr-1" />
                  {result.errors.length} issue{result.errors.length > 1 ? 's' : ''}:
                </p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-leave-dark">{err}</p>
                ))}
              </div>
            )}

            {result.success && (
              <Button fullWidth loading={importing} onClick={handleImport}>
                Import {result.validRows} Students
              </Button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  )
}

// ─── Student Row ──────────────────────────────────────────────────────────────

interface StudentRowProps {
  student: Student
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function StudentRow({ student, onSelect, onEdit, onDelete }: StudentRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex items-center gap-2 px-4 py-3">
      {/* Tap to view profile */}
      <button
        onClick={onSelect}
        className="flex items-center gap-3 flex-1 min-w-0 text-left
                   active:opacity-70 transition-opacity"
      >
        <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-primary-600">{student.rollNo}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-800 text-sm truncate">{student.name}</p>
        </div>
        <ChevronRight size={16} className="text-slate-300 shrink-0" />
      </button>

      {/* Actions menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600
                     hover:bg-surface-tertiary transition-all active:scale-90"
          aria-label="Student options"
        >
          <MoreVertical size={15} />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-9 z-20 bg-white rounded-2xl shadow-elevated
                            border border-slate-100 py-1 min-w-[150px] animate-scale-in">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                           text-slate-700 hover:bg-surface-tertiary transition-colors"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                           text-absent hover:bg-absent-light transition-colors"
              >
                <Trash2 size={14} />
                Remove
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Students Tab ─────────────────────────────────────────────────────────────

interface StudentsTabProps {
  classId: number
  onSelectStudent: (studentId: number) => void
}

function StudentsTab({ classId, onSelectStudent }: StudentsTabProps) {
  const students = useStudentsInClass()
  const loadStudentsForClass = useAppStore(s => s.loadStudentsForClass)
  const deleteStudent = useAppStore(s => s.deleteStudent)

  const [addOpen, setAddOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)

  const existingRollNos = students.map(s => s.rollNo)

  const nextRollNo = students.length > 0
    ? Math.max(...students.map(s => s.rollNo)) + 1
    : 1

  const { query, setQuery, filtered } = useSearch(
    students,
    s => `${s.rollNo} ${s.name}`,
  )

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Action Buttons */}
      <div className="px-4 flex gap-2 mb-4">
        <Button
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => setAddOpen(true)}
          fullWidth
        >
          Add Student
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Upload size={15} />}
          onClick={() => setBulkOpen(true)}
          fullWidth
        >
          Bulk Import
        </Button>
      </div>

      {/* Search */}
      {students.length > 5 && (
        <div className="px-4 mb-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name or roll no..."
          />
        </div>
      )}

      {/* List */}
      {students.length === 0 ? (
        <EmptyState
          icon={<Users size={28} />}
          title="No students yet"
          description="Add students manually or import from a CSV file"
          action={
            <Button icon={<Plus size={16} />} size="sm" onClick={() => setAddOpen(true)}>
              Add First Student
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No students found"
          description={`No student matches "${query}"`}
        />
      ) : (
        <div className="px-4">
          <Card padding="none">
            {filtered.map((student, idx) => (
              <div key={student.id}>
                <StudentRow
                  student={student}
                  onSelect={() => onSelectStudent(student.id!)}
                  onEdit={() => setEditTarget(student)}
                  onDelete={() => setDeleteTarget(student)}
                />
                {idx < filtered.length - 1 && (
                  <div className="border-t border-slate-50 mx-4" />
                )}
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Sheets */}
      <AddStudentSheet
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); loadStudentsForClass(classId) }}
        classId={classId}
        nextRollNo={nextRollNo}
        existingRollNos={existingRollNos}
      />

      <EditStudentSheet
        student={editTarget}
        onClose={() => setEditTarget(null)}
        existingRollNos={existingRollNos}
      />

      <BulkImportSheet
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        classId={classId}
        existingRollNos={existingRollNos}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Student"
        message={`Remove "${deleteTarget?.name}" from this class? Their attendance history will also be deleted.`}
        confirmLabel="Remove"
        loading={deleting}
      />
    </>
  )
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

interface AttendanceTabProps {
  classId: number
}

function AttendanceTab({ classId }: AttendanceTabProps) {
  const students = useStudentsInClass()
  const todayAttendance = useTodayAttendance()
  const attendanceDate = useAttendanceDate()
  const profile = useProfile()
  const todayIsHoliday = useTodayIsHoliday()
  const todayHolidayName = useAppStore(s => s.todayHolidayName)
  const weeklyOffDays = profile?.weeklyOffDays ?? []
  const isRecurringOffDay = isWeeklyOffDay(attendanceDate, weeklyOffDays)
  const setAttendanceDate = useAppStore(s => s.setAttendanceDate)
  const markAttendance = useAppStore(s => s.markAttendance)
  const markAllPresent = useAppStore(s => s.markAllPresent)
  const clearAllAttendance = useAppStore(s => s.clearAllAttendance)

  const { query, setQuery, filtered } = useSearch(
    students,
    s => `${s.rollNo} ${s.name}`,
  )

  const getStatus = (studentId: number): AttendanceStatus | null => {
    const record = todayAttendance.find(a => a.studentId === studentId)
    return record?.status ?? null
  }

  const markedCount = todayAttendance.length
  const isHolidayDate = todayAttendance.some(a => a.status === 'holiday') || isRecurringOffDay || (attendanceDate === new Date().toISOString().split('T')[0] && todayIsHoliday)

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare size={28} />}
        title="No students to mark"
        description="Add students in the Students tab first"
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Date Navigator */}
      <div className="px-4">
        <DateNavigator
          date={attendanceDate}
          onChange={setAttendanceDate}
          disableFuture
        />
      </div>

      {/* Holiday Banner — always visible on holiday/recurring off days */}
      {isHolidayDate && (
        <div className="mx-4 bg-holiday-light rounded-2xl px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🎉</span>
          <div>
            <p className="text-sm font-semibold text-holiday-dark">
              {isRecurringOffDay
                ? `Weekly Off — ${new Date(attendanceDate + 'T00:00:00').toLocaleDateString('en', { weekday: 'long' })}`
                : attendanceDate === todayAD() ? todayHolidayName : 'Holiday'
              }
            </p>
            <p className="text-xs text-holiday">
              {markedCount > 0 && todayAttendance.some(a => a.status !== 'holiday')
                ? 'Attendance marked — tap Clear All to restore holiday'
                : 'Attendance auto-marked as Holiday'
              }
            </p>
          </div>
        </div>
      )}

      {/* Progress + Actions */}
      <div className="px-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {markedCount}/{students.length} marked
          </span>
          {markedCount === students.length && markedCount > 0 && (
            <Badge color="green" dot>Done</Badge>
          )}
        </div>
        {/* Show Clear All when marked, Mark All Present when not marked */}
        {markedCount > 0 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => clearAllAttendance(classId, attendanceDate)}
          >
            Clear All
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => markAllPresent(classId, attendanceDate)}
          >
            Mark All Present
          </Button>
        )}
      </div>

      {/* Search */}
      {students.length > 8 && (
        <div className="px-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search student..."
          />
        </div>
      )}

      {/* Student Attendance List */}
      <div className="px-4">
        <Card padding="none">
          {filtered.map((student, idx) => {
            const status = getStatus(student.id!)
            return (
              <div key={student.id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-tertiary flex items-center
                                  justify-center shrink-0">
                    <span className="text-xs font-bold text-slate-500">{student.rollNo}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 text-sm truncate">{student.name}</p>
                    {status && <StatusBadge status={status} size="sm" />}
                  </div>

                  <div className="flex gap-1.5 shrink-0">
                    {(['present', 'absent', 'leave'] as AttendanceStatus[]).map(s => (
                      <AttendanceToggle
                        key={s}
                        status={status}
                        targetStatus={s}
                        onSelect={selected =>
                          markAttendance(student.id!, classId, attendanceDate, selected)
                        }
                      />
                    ))}
                  </div>
                </div>
                {idx < filtered.length - 1 && (
                  <div className="border-t border-slate-50 mx-4" />
                )}
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}

// ─── Class Detail Page ────────────────────────────────────────────────────────

interface ClassDetailPageProps {
  onBack: () => void
  onSelectStudent: (studentId: number) => void
}

export function ClassDetailPage({ onBack, onSelectStudent }: ClassDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('students')
  const cls = useSelectedClass()
  const students = useStudentsInClass()

  if (!cls) return null

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">
      <PageHeader
        title={cls.name}
        subtitle={`${students.length} student${students.length !== 1 ? 's' : ''}`}
        onBack={onBack}
      />

      {/* Tab Bar */}
      <div className="flex mx-4 mb-4 bg-surface-tertiary rounded-2xl p-1 gap-1">
        {([
          { key: 'students', label: '👥 Students' },
          { key: 'attendance', label: '✅ Attendance' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`
              flex-1 py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-150 active:scale-[0.97]
              ${activeTab === key
                ? 'bg-white text-primary-700 shadow-soft'
                : 'text-slate-500 hover:text-slate-700'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'students' ? (
        <StudentsTab classId={cls.id!} onSelectStudent={onSelectStudent} />
      ) : (
        <AttendanceTab classId={cls.id!} />
      )}
    </div>
  )
}