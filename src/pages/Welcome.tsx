import { useState, useRef } from 'react'
import { ArrowRight, BookOpen } from 'lucide-react'
import { Input, Button } from '@/components/ui'
import { useAppStore } from '@/store/useAppStore'
import type { DateSystem } from '@/types'

// ─── Slide Definitions ────────────────────────────────────────────────────────

const slides = [
  {
    id: 0,
    // Logo with aura glow
    logo: (
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <div className="absolute w-44 h-44 rounded-full bg-primary-100 opacity-60" />
        {/* Inner glow ring */}
        <div className="absolute w-36 h-36 rounded-full bg-primary-200 opacity-50" />
        {/* Logo circle */}
        <div className="relative w-28 h-28 rounded-full bg-primary-800 flex items-center
                        justify-center shadow-elevated z-10">
          <span className="text-white font-bold text-4xl tracking-tight"
            style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
            H
          </span>
        </div>
      </div>
    ),
    title: 'Hajiri',
    titleAccent: 'Sahayog',
    tagline: 'Your attendance companion.',
    cta: 'Get Started',
    trust: 'Free forever · Works offline',
  },
  {
    id: 1,
    logo: (
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 rounded-full bg-present-light opacity-70" />
        <div className="absolute w-36 h-36 rounded-full bg-present-light opacity-50" />
        <div className="relative w-28 h-28 rounded-full bg-present-dark flex items-center
                        justify-center shadow-elevated z-10">
          <span className="text-5xl">✅</span>
        </div>
      </div>
    ),
    title: 'Simple &',
    titleAccent: 'Fast.',
    tagline: 'Mark attendance for your whole class in seconds. No training needed.',
    cta: 'Continue',
    trust: 'BS and AD calendar supported',
  },
  {
    id: 2,
    logo: (
      <div className="relative flex items-center justify-center">
        <div className="absolute w-44 h-44 rounded-full bg-slate-100 opacity-70" />
        <div className="absolute w-36 h-36 rounded-full bg-slate-200 opacity-50" />
        <div className="relative w-28 h-28 rounded-full bg-slate-700 flex items-center
                        justify-center shadow-elevated z-10">
          <span className="text-5xl">🔒</span>
        </div>
      </div>
    ),
    title: 'Your data,',
    titleAccent: 'your device.',
    tagline: 'Everything stays on your phone. No server, no account, no internet needed.',
    cta: 'Set Up Profile',
    trust: 'Export anytime from Settings as backup',
  },
]

// ─── Progress Dots ────────────────────────────────────────────────────────────

function Dots({ total, current, onTap }: {
  total: number
  current: number
  onTap: (i: number) => void
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onTap(i)}
          className={`rounded-full transition-all duration-300
            ${i === current ? 'w-7 h-2.5 bg-primary-700' : 'w-2.5 h-2.5 bg-slate-300'}`}
        />
      ))}
    </div>
  )
}

// ─── Profile Setup ────────────────────────────────────────────────────────────

function ProfileSetup({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [dateSystem, setDateSystem] = useState<DateSystem>('BS')
  const [errors, setErrors] = useState<{ name?: string; schoolName?: string }>({})
  const [loading, setLoading] = useState(false)
  const saveProfile = useAppStore(s => s.saveProfile)

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

        {/* Back */}
        <button
          onClick={onBack}
          className="text-sm text-slate-400 font-medium hover:text-slate-600
                     transition-colors mb-6 flex items-center gap-1"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center
                          shadow-elevated mx-auto mb-4">
            <BookOpen size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Set Up Your Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Takes less than a minute</p>
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

          {/* Date System */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">
              Date System <span className="text-absent">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['BS', 'AD'] as DateSystem[]).map(sys => (
                <button
                  key={sys}
                  onClick={() => setDateSystem(sys)}
                  className={`py-3 rounded-xl text-sm font-semibold border-2
                              transition-all duration-150 active:scale-[0.98]
                              ${dateSystem === sys
                                ? 'border-primary-500 bg-primary-50 text-primary-700'
                                : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
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

        <Button fullWidth size="lg" loading={loading} onClick={handleSubmit}>
          Get Started
        </Button>

        <p className="text-xs text-slate-400 text-center mt-4">
          You can change these settings anytime
        </p>
      </div>
    </div>
  )
}

// ─── Slide Screen ─────────────────────────────────────────────────────────────

function SlideScreen({
  slide,
  onNext,
  onSkip,
  current,
  total,
  onDotTap,
  isLast,
}: {
  slide: typeof slides[0]
  onNext: () => void
  onSkip: () => void
  current: number
  total: number
  onDotTap: (i: number) => void
  isLast: boolean
}) {
  // Background tints per slide
  const backgrounds = [
    'linear-gradient(160deg, #eff6ff 0%, #ffffff 50%, #dbeafe 100%)',
    'linear-gradient(160deg, #f0fdf4 0%, #ffffff 50%, #dcfce7 100%)',
    'linear-gradient(160deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)',
  ]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: backgrounds[slide.id] }}
    >
      {/* Skip */}
      <div className="flex justify-end px-6 pt-12 h-16">
        {!isLast && (
          <button
            onClick={onSkip}
            className="text-sm text-slate-400 font-medium hover:text-slate-600
                       transition-colors px-3 py-1.5 rounded-xl"
          >
            Skip
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-10">

        {/* Logo with aura */}
        <div className="animate-fade-in" key={`logo-${slide.id}`}>
          {slide.logo}
        </div>

        {/* Text */}
        <div className="text-center animate-slide-up" key={`text-${slide.id}`}>
          <h1 className="font-bold text-slate-800 leading-tight"
            style={{ fontSize: '2.25rem' }}>
            {slide.title}
          </h1>
          <h1
            className="font-bold leading-tight text-primary-700"
            style={{ fontSize: '2.25rem', fontFamily: 'Georgia, serif', fontStyle: 'italic' }}
          >
            {slide.titleAccent}
          </h1>
          <p className="text-slate-500 mt-4 text-sm leading-relaxed max-w-xs mx-auto">
            {slide.tagline}
          </p>
        </div>
      </div>

      {/* Bottom */}
      <div className="flex flex-col items-center gap-5 px-8 pb-12 pt-4">
        {/* CTA Button */}
        <button
          onClick={onNext}
          className="w-full max-w-sm py-4 rounded-2xl bg-primary-800 text-white
                     font-semibold text-base flex items-center justify-center gap-2
                     active:scale-[0.98] transition-all duration-150 shadow-elevated"
        >
          {slide.cta}
          <ArrowRight size={18} />
        </button>

        {/* Trust line */}
        <p className="text-xs text-slate-400 font-medium">{slide.trust}</p>

        {/* Dots */}
        <Dots total={total} current={current} onTap={onDotTap} />
      </div>
    </div>
  )
}

// ─── Welcome Page (root) ──────────────────────────────────────────────────────

export function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const isLast = currentSlide === slides.length - 1

  const goNext = () => {
    if (isLast) setShowProfile(true)
    else setCurrentSlide(p => p + 1)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) setCurrentSlide(p => p + 1)
      if (diff < 0 && currentSlide > 0) setCurrentSlide(p => p - 1)
    }
    touchStartX.current = null
  }

  if (showProfile) {
    return <ProfileSetup onBack={() => setShowProfile(false)} />
  }

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="select-none"
    >
      <SlideScreen
        slide={slides[currentSlide]}
        onNext={goNext}
        onSkip={() => setShowProfile(true)}
        current={currentSlide}
        total={slides.length}
        onDotTap={setCurrentSlide}
        isLast={isLast}
      />
    </div>
  )
}