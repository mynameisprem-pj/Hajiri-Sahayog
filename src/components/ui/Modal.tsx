import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { IconButton } from './Button'

// ─── Modal ────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className={`
        relative w-full ${sizeMap[size]} bg-white rounded-3xl shadow-elevated
        animate-slide-up overflow-hidden
      `}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <IconButton
              icon={<X size={18} />}
              label="Close"
              onClick={onClose}
              size="sm"
            />
          </div>
        )}

        {/* Content */}
        <div className={title ? 'px-5 py-4' : 'p-5'}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 pb-5 pt-2 flex gap-3 justify-end border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────
// Used for quick action sheets on mobile (add class, add student, etc.)

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children, footer }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-elevated animate-slide-up"
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <IconButton
              icon={<X size={18} />}
              label="Close"
              onClick={onClose}
              size="sm"
            />
          </div>
        )}

        {/* Content */}
        <div className={`${title ? 'px-5 py-4' : 'px-5 pt-3 pb-4'} max-h-[70vh] overflow-y-auto`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-5 pb-6 pt-2 flex gap-3 border-t border-slate-100 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}: ConfirmDialogProps) {
  const confirmColors = {
    danger:  'bg-absent text-white hover:bg-red-600 active:bg-red-700',
    warning: 'bg-leave text-white hover:bg-amber-600 active:bg-amber-700',
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        <div className={`
          w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl
          ${variant === 'danger' ? 'bg-absent-light' : 'bg-leave-light'}
        `}>
          {variant === 'danger' ? '⚠️' : '❓'}
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm
                       hover:bg-slate-200 active:bg-slate-300 transition-all duration-150
                       disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl font-medium text-sm
                        transition-all duration-150 active:scale-95
                        disabled:opacity-50 disabled:active:scale-100
                        ${confirmColors[variant]}`}
          >
            {loading ? 'Please wait...' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}