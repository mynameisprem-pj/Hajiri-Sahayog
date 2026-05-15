import { useState } from 'react'
import { Plus, BookOpen, Users, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import {
  PageHeader, Button, Card, EmptyState, BottomSheet,
  Input, ConfirmDialog, SearchBar, useSearch,
} from '@/components/ui'
import { useClasses, useAppStore } from '@/store/useAppStore'
import type { ClassWithStats } from '@/types'

// ─── Class Item ───────────────────────────────────────────────────────────────

interface ClassItemProps {
  cls: ClassWithStats
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

function ClassItem({ cls, onSelect, onEdit, onDelete }: ClassItemProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const statusDot = {
    marked:  'bg-present',
    pending: 'bg-leave',
    holiday: 'bg-holiday',
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {/* Tap area */}
      <button
        onClick={onSelect}
        className="flex items-center gap-3 flex-1 min-w-0 text-left active:opacity-70
                   transition-opacity"
      >
        <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center
                        justify-center shrink-0">
          <BookOpen size={20} className="text-primary-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800 truncate">{cls.name}</p>
            <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot[cls.todayStatus]}`} />
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Users size={11} className="text-slate-400" />
            <p className="text-xs text-slate-500">{cls.studentCount} students</p>
          </div>
        </div>
      </button>

      {/* Menu */}
      <div className="relative shrink-0">
        <button
          onClick={() => setMenuOpen(p => !p)}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600
                     hover:bg-surface-tertiary transition-all active:scale-90"
          aria-label="Class options"
        >
          <MoreVertical size={18} />
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-10 z-20 bg-white rounded-2xl shadow-elevated
                            border border-slate-100 py-1 min-w-[140px] animate-scale-in">
              <button
                onClick={() => { setMenuOpen(false); onEdit() }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                           text-slate-700 hover:bg-surface-tertiary transition-colors"
              >
                <Pencil size={14} />
                Edit Name
              </button>
              <button
                onClick={() => { setMenuOpen(false); onDelete() }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm
                           text-absent hover:bg-absent-light transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Classes Page ─────────────────────────────────────────────────────────────

interface ClassesPageProps {
  onSelectClass: (classId: number) => void
}

export function ClassesPage({ onSelectClass }: ClassesPageProps) {
  const classes = useClasses()
  const addClass = useAppStore(s => s.addClass)
  const updateClass = useAppStore(s => s.updateClass)
  const deleteClass = useAppStore(s => s.deleteClass)

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ClassWithStats | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClassWithStats | null>(null)
  const [className, setClassName] = useState('')
  const [classError, setClassError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const { query, setQuery, filtered } = useSearch(
    classes,
    cls => cls.name,
  )

  const openAdd = () => {
    setClassName('')
    setClassError('')
    setAddOpen(true)
  }

  const openEdit = (cls: ClassWithStats) => {
    setEditTarget(cls)
    setClassName(cls.name)
    setClassError('')
  }

  const handleSave = async () => {
    if (!className.trim()) {
      setClassError('Class name is required')
      return
    }
    setSaving(true)
    try {
      if (editTarget) {
        await updateClass(editTarget.id!, className)
        setEditTarget(null)
      } else {
        await addClass(className)
        setAddOpen(false)
      }
      setClassName('')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id) return
    setDeleting(true)
    try {
      await deleteClass(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">
      <PageHeader
        title="My Classes"
        subtitle={`${classes.length} class${classes.length !== 1 ? 'es' : ''}`}
        action={
          <Button
            size="sm"
            icon={<Plus size={16} />}
            onClick={openAdd}
          >
            Add
          </Button>
        }
      />

      <div className="px-4 flex flex-col gap-4">
        {/* Search */}
        {classes.length > 3 && (
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search classes..."
          />
        )}

        {/* List */}
        {classes.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={28} />}
            title="No classes yet"
            description="Add your first class and start managing attendance"
            action={
              <Button icon={<Plus size={16} />} onClick={openAdd}>
                Add First Class
              </Button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No classes found"
            description={`No class matches "${query}"`}
          />
        ) : (
          <Card padding="none">
            {filtered.map((cls, idx) => (
              <div key={cls.id}>
                <ClassItem
                  cls={cls}
                  onSelect={() => onSelectClass(cls.id!)}
                  onEdit={() => openEdit(cls)}
                  onDelete={() => setDeleteTarget(cls)}
                />
                {idx < filtered.length - 1 && (
                  <div className="border-t border-slate-50 mx-4" />
                )}
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* ── Add Class Sheet ────────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Class"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              Add Class
            </Button>
          </>
        }
      >
        <Input
          label="Class Name"
          placeholder="e.g. Class 8A, Science Batch, Evening Tution"
          value={className}
          onChange={e => {
            setClassName(e.target.value)
            setClassError('')
          }}
          error={classError}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </BottomSheet>

      {/* ── Edit Class Sheet ───────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Class Name"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handleSave}>
              Save Changes
            </Button>
          </>
        }
      >
        <Input
          label="Class Name"
          placeholder="e.g. Class 8A"
          value={className}
          onChange={e => {
            setClassName(e.target.value)
            setClassError('')
          }}
          error={classError}
          autoFocus
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
      </BottomSheet>

      {/* ── Delete Confirm ─────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Class"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All students and attendance records in this class will be permanently deleted.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  )
}