import { useState } from 'react'
import { BookOpen, Shield } from 'lucide-react'
import { Button, Input } from '@/components/ui'
import { useAppStore } from '@/store/useAppStore'
import { APP_NAME, DISCLAIMER_TEXT, type DateSystem } from '@/types'

// ─── Steps ────────────────────────────────────────────────────────────────────

type Step = 'disclaimer' | 'profile'

export function WelcomePage() {
  const [step, setStep] = useState<Step>('disclaimer')
  const [name, setName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [dateSystem, setDateSystem] = useState<DateSystem>('BS')
  const [errors, setErrors] = useState<{ name?: string; schoolName?: string }>({})
  const [loading, setLoading] = useState(false)

  const saveProfile = useAppStore(s => s.saveProfile)

  // ── Disclaimer Step ─────────────────────────────────────────────────────────

  if (step === 'disclaimer') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50
                      flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-3xl bg-primary-600 flex items-center justify-center
                            shadow-elevated mb-4">
              <BookOpen size={36} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{APP_NAME}</h1>
            <p className="text-sm text-slate-500 mt-1 text-center">
              Your simple attendance companion
            </p>
          </div>

          {/* Disclaimer Card */}
          <div className="bg-white rounded-3xl shadow-card p-5 mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-leave-light flex items-center justify-center">
                <Shield size={16} className="text-leave-dark" />
              </div>
              <h2 className="font-semibold text-slate-800">Important Notice</h2>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {DISCLAIMER_TEXT}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 text-center">
                Please read and understand before continuing.
              </p>
            </div>
          </div>

          <Button
            fullWidth
            size="lg"
            onClick={() => setStep('profile')}
          >
            I Understand, Continue
          </Button>
        </div>
      </div>
    )
  }

  // ── Profile Setup Step ──────────────────────────────────────────────────────

  const validate = () => {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Your name is required'
    if (!schoolName.trim()) e.schoolName = 'School or institution name is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await saveProfile({
        name: name.trim(),
        schoolName: schoolName.trim(),
        dateSystem,
        weeklyOffDays: [],
        disclaimerAccepted: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50
                    flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center
                          shadow-elevated mx-auto mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Set Up Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">
            This takes less than a minute
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl shadow-card p-5 flex flex-col gap-4 mb-6">

          <Input
            label="Your Name"
            placeholder="e.g. Ram Bahadur Thapa"
            value={name}
            onChange={e => {
              setName(e.target.value)
              if (errors.name) setErrors(p => ({ ...p, name: undefined }))
            }}
            error={errors.name}
            required
            autoFocus
            autoComplete="name"
          />

          <Input
            label="School / Institution Name"
            placeholder="e.g. Shree Saraswati Secondary School"
            value={schoolName}
            onChange={e => {
              setSchoolName(e.target.value)
              if (errors.schoolName) setErrors(p => ({ ...p, schoolName: undefined }))
            }}
            error={errors.schoolName}
            required
            autoComplete="organization"
          />

          {/* Date System Toggle */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Date System <span className="text-absent">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['BS', 'AD'] as DateSystem[]).map(sys => (
                <button
                  key={sys}
                  onClick={() => setDateSystem(sys)}
                  className={`
                    py-3 rounded-xl text-sm font-semibold border-2 transition-all duration-150
                    active:scale-[0.98]
                    ${dateSystem === sys
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    }
                  `}
                >
                  {sys === 'BS' ? '🇳🇵 BS (Nepali)' : '🌐 AD (English)'}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              {dateSystem === 'BS'
                ? 'Dates will show in Bikram Sambat (Baisakh, Jestha...)'
                : 'Dates will show in Gregorian calendar (January, February...)'}
            </p>
          </div>
        </div>

        <Button
          fullWidth
          size="lg"
          loading={loading}
          onClick={handleSubmit}
        >
          Get Started
        </Button>

        <p className="text-xs text-slate-400 text-center mt-4">
          You can change these settings anytime
        </p>
      </div>
    </div>
  )
}