import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import type { VoiceInputState } from '@/types'

// ─── Base Input ───────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  rightElement?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightElement,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
          {props.required && <span className="text-absent ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          className={[
            'w-full py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400',
            'transition-all duration-200',
            'disabled:bg-surface-tertiary disabled:text-slate-400 disabled:cursor-not-allowed',
            error
              ? 'border-absent bg-absent-light/30 focus:ring-absent/20 focus:border-absent'
              : 'border-slate-200 bg-white hover:border-slate-300',
            leftIcon ? 'pl-9' : 'pl-4',
            rightElement ? 'pr-12' : 'pr-4',
          ].join(' ')}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-absent font-medium">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// ─── Voice Input Field ────────────────────────────────────────────────────────
// Input with a mic button for voice-to-text name entry

interface VoiceInputFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  voiceState: VoiceInputState
  onVoiceStart: () => void
  onVoiceStop: () => void
  isVoiceSupported: boolean
}

const micStateStyles: Record<VoiceInputState, string> = {
  idle:       'text-slate-400 hover:text-primary-600 hover:bg-primary-50',
  listening:  'text-white bg-absent animate-pulse',
  processing: 'text-white bg-primary-500',
  error:      'text-absent hover:text-absent-dark',
}

const micStateLabels: Record<VoiceInputState, string> = {
  idle:       'Start voice input',
  listening:  'Listening... tap to stop',
  processing: 'Processing...',
  error:      'Voice input error, tap to retry',
}

export const VoiceInputField = forwardRef<HTMLInputElement, VoiceInputFieldProps>(({
  label,
  error,
  voiceState,
  onVoiceStart,
  onVoiceStop,
  isVoiceSupported,
  className = '',
  ...props
}, ref) => {
  const handleMicClick = () => {
    if (voiceState === 'listening') {
      onVoiceStop()
    } else {
      onVoiceStart()
    }
  }

  const MicIcon = voiceState === 'error' ? MicOff : Mic

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-slate-700">
          {label}
          {props.required && <span className="text-absent ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          className={[
            'w-full pl-4 py-2.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-400',
            'transition-all duration-200',
            isVoiceSupported ? 'pr-12' : 'pr-4',
            voiceState === 'listening'
              ? 'border-absent ring-2 ring-absent/20 bg-absent-light/10'
              : error
                ? 'border-absent bg-absent-light/30'
                : 'border-slate-200 bg-white hover:border-slate-300',
          ].join(' ')}
          {...props}
        />

        {/* Mic Button */}
        {isVoiceSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={voiceState === 'processing'}
            className={`
              absolute right-2.5 top-1/2 -translate-y-1/2
              w-7 h-7 rounded-lg flex items-center justify-center
              transition-all duration-150 active:scale-90
              disabled:cursor-not-allowed
              ${micStateStyles[voiceState]}
            `}
            aria-label={micStateLabels[voiceState]}
            title={micStateLabels[voiceState]}
          >
            {voiceState === 'processing' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MicIcon size={14} />
            )}
          </button>
        )}
      </div>

      {/* Listening hint */}
      {voiceState === 'listening' && (
        <p className="text-xs text-absent font-medium flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-absent animate-pulse inline-block" />
          Listening... speak the student's name
        </p>
      )}

      {error && voiceState !== 'listening' && (
        <p className="text-xs text-absent font-medium">{error}</p>
      )}
    </div>
  )
})

VoiceInputField.displayName = 'VoiceInputField'