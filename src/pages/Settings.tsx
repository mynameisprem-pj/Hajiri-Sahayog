import { useState } from 'react'
import {
  User, School, Calendar, Download, Upload,
  RotateCcw, Info, Mail, Shield, ChevronRight,
  CheckCircle,
} from 'lucide-react'
import {
  PageHeader, Button, Card, BottomSheet, Input, ConfirmDialog,
} from '@/components/ui'
import { useProfile, useAppStore } from '@/store/useAppStore'
import { pickBackupFile } from '@/utils/helpers'
import {
  APP_NAME, APP_VERSION, DEVELOPER_NAME,
  DEVELOPER_EMAIL, DISCLAIMER_TEXT, type DateSystem,
} from '@/types'

// ─── Settings Row ─────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon: React.ReactNode
  label: string
  value?: string
  onClick?: () => void
  danger?: boolean
  rightElement?: React.ReactNode
}

function SettingsRow({ icon, label, value, onClick, danger = false, rightElement }: SettingsRowProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        flex items-center gap-3 w-full px-4 py-4 text-left
        ${onClick ? 'active:bg-surface-tertiary transition-colors' : 'cursor-default'}
      `}
    >
      <div className={`
        w-9 h-9 rounded-xl flex items-center justify-center shrink-0
        ${danger ? 'bg-absent-light text-absent' : 'bg-primary-50 text-primary-600'}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${danger ? 'text-absent' : 'text-slate-800'}`}>
          {label}
        </p>
        {value && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{value}</p>
        )}
      </div>
      {rightElement ?? (onClick && (
        <ChevronRight size={16} className="text-slate-300 shrink-0" />
      ))}
    </button>
  )
}

// ─── Settings Page ────────────────────────────────────────────────────────────

export function SettingsPage() {
  const profile = useProfile()
  const updateProfile = useAppStore(s => s.updateProfile)
  const setDateSystem = useAppStore(s => s.setDateSystem)
  const exportData = useAppStore(s => s.exportData)
  const importData = useAppStore(s => s.importData)
  const resetApp = useAppStore(s => s.resetApp)
  const showToast = useAppStore(s => s.showToast)

  // Sheet states
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [dateSystemOpen, setDateSystemOpen] = useState(false)
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  // Edit profile form
  const [name, setName] = useState(profile?.name ?? '')
  const [schoolName, setSchoolName] = useState(profile?.schoolName ?? '')
  const [errors, setErrors] = useState<{ name?: string; schoolName?: string }>({})
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const openEditProfile = () => {
    setName(profile?.name ?? '')
    setSchoolName(profile?.schoolName ?? '')
    setErrors({})
    setEditProfileOpen(true)
  }

  const handleSaveProfile = async () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!schoolName.trim()) e.schoolName = 'School name is required'
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    try {
      await updateProfile({ name: name.trim(), schoolName: schoolName.trim() })
      setEditProfileOpen(false)
      showToast('success', 'Profile updated')
    } finally {
      setSaving(false)
    }
  }

  const handleDateSystem = async (system: DateSystem) => {
    await setDateSystem(system)
    setDateSystemOpen(false)
    showToast('success', `Date system changed to ${system}`)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportData()
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    const file = await pickBackupFile()
    if (!file) return
    setImporting(true)
    try {
      await importData(file)
    } finally {
      setImporting(false)
    }
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      await resetApp()
      setResetOpen(false)
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-surface-secondary pb-24">
      <PageHeader title="Settings" />

      <div className="px-4 flex flex-col gap-5">

        {/* ── Profile ───────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Profile
          </p>
          <Card padding="none">
            <SettingsRow
              icon={<User size={17} />}
              label={profile?.name ?? '—'}
              value="Your Name"
              onClick={openEditProfile}
            />
            <div className="border-t border-slate-50 mx-4" />
            <SettingsRow
              icon={<School size={17} />}
              label={profile?.schoolName ?? '—'}
              value="School / Institution"
              onClick={openEditProfile}
            />
          </Card>
        </div>

        {/* ── Preferences ──────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Preferences
          </p>
          <Card padding="none">
            <SettingsRow
              icon={<Calendar size={17} />}
              label="Date System"
              value={profile?.dateSystem === 'BS' ? 'BS — Bikram Sambat (Nepali)' : 'AD — Gregorian (English)'}
              onClick={() => setDateSystemOpen(true)}
            />
          </Card>
        </div>

        {/* ── Backup & Restore ──────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Backup & Restore
          </p>
          <Card padding="none">
            <SettingsRow
              icon={<Download size={17} />}
              label="Export Data"
              value="Download a backup of all your data"
              onClick={handleExport}
              rightElement={
                exporting ? (
                  <span className="text-xs text-primary-600 font-medium">Exporting...</span>
                ) : undefined
              }
            />
            <div className="border-t border-slate-50 mx-4" />
            <SettingsRow
              icon={<Upload size={17} />}
              label="Import Data"
              value="Restore from a backup file"
              onClick={handleImport}
              rightElement={
                importing ? (
                  <span className="text-xs text-primary-600 font-medium">Importing...</span>
                ) : undefined
              }
            />
          </Card>
          <p className="text-xs text-slate-400 mt-2 px-1">
            💡 Export your data regularly and keep it safe. At year end, export before resetting.
          </p>
        </div>

        {/* ── App Info ──────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            App Information
          </p>
          <Card padding="none">
            <SettingsRow
              icon={<Info size={17} />}
              label={APP_NAME}
              value={`Version ${APP_VERSION}`}
            />
            <div className="border-t border-slate-50 mx-4" />
            <SettingsRow
              icon={<User size={17} />}
              label={`Developer: ${DEVELOPER_NAME}`}
              value="Built with ❤️ for teachers of Nepal"
            />
            <div className="border-t border-slate-50 mx-4" />
            <SettingsRow
              icon={<Mail size={17} />}
              label="Contact"
              value={DEVELOPER_EMAIL}
              onClick={() => window.open(`mailto:${DEVELOPER_EMAIL}`, '_blank')}
            />
            <div className="border-t border-slate-50 mx-4" />
            <SettingsRow
              icon={<Shield size={17} />}
              label="Data Privacy Disclaimer"
              value="Tap to read"
              onClick={() => setDisclaimerOpen(true)}
            />
          </Card>
        </div>

        {/* ── Danger Zone ───────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Danger Zone
          </p>
          <Card padding="none">
            <SettingsRow
              icon={<RotateCcw size={17} />}
              label="Reset App"
              value="Delete all data and start fresh"
              onClick={() => setResetOpen(true)}
              danger
            />
          </Card>
          <p className="text-xs text-absent mt-2 px-1">
            ⚠️ This permanently deletes everything. Export your data first!
          </p>
        </div>
      </div>

      {/* ── Edit Profile Sheet ─────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Profile"
        footer={
          <>
            <Button variant="secondary" fullWidth onClick={() => setEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button fullWidth loading={saving} onClick={handleSaveProfile}>
              Save
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Your Name"
            placeholder="e.g. Ram Bahadur Thapa"
            value={name}
            onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: undefined })) }}
            error={errors.name}
            autoFocus
          />
          <Input
            label="School / Institution Name"
            placeholder="e.g. Shree Saraswati Secondary School"
            value={schoolName}
            onChange={e => { setSchoolName(e.target.value); setErrors(p => ({ ...p, schoolName: undefined })) }}
            error={errors.schoolName}
          />
        </div>
      </BottomSheet>

      {/* ── Date System Sheet ──────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={dateSystemOpen}
        onClose={() => setDateSystemOpen(false)}
        title="Date System"
      >
        <div className="flex flex-col gap-3">
          {(['BS', 'AD'] as DateSystem[]).map(sys => {
            const isActive = profile?.dateSystem === sys
            return (
              <button
                key={sys}
                onClick={() => handleDateSystem(sys)}
                className={`
                  flex items-center gap-4 p-4 rounded-2xl border-2 text-left
                  transition-all duration-150 active:scale-[0.98]
                  ${isActive
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                  }
                `}
              >
                <span className="text-2xl">{sys === 'BS' ? '🇳🇵' : '🌐'}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isActive ? 'text-primary-700' : 'text-slate-800'}`}>
                    {sys === 'BS' ? 'BS — Bikram Sambat' : 'AD — Gregorian'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sys === 'BS'
                      ? 'Baisakh, Jestha, Ashadh...'
                      : 'January, February, March...'
                    }
                  </p>
                </div>
                {isActive && (
                  <CheckCircle size={20} className="text-primary-600 shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </BottomSheet>

      {/* ── Disclaimer Sheet ───────────────────────────────────────────────── */}
      <BottomSheet
        isOpen={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        title="Data Privacy Disclaimer"
      >
        <div className="bg-leave-light rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-leave-dark shrink-0" />
            <p className="text-sm font-semibold text-leave-dark">Important Notice</p>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {DISCLAIMER_TEXT}
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            {APP_NAME} v{APP_VERSION} · {DEVELOPER_NAME}
          </p>
        </div>
      </BottomSheet>

      {/* ── Reset Confirm ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={handleReset}
        title="Reset App"
        message="This will permanently delete your profile, all classes, students, attendance records, and holidays. This cannot be undone. Make sure you have exported your data first."
        confirmLabel="Yes, Reset Everything"
        cancelLabel="Cancel"
        loading={resetting}
      />
    </div>
  )
}