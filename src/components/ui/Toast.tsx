import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useToasts, useAppStore } from '@/store/useAppStore'
import type { ToastMessage } from '@/types'

// ─── Single Toast ─────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: ToastMessage
}

const toastConfig = {
  success: {
    icon: CheckCircle,
    bg: 'bg-white border-present',
    iconColor: 'text-present',
    titleColor: 'text-slate-800',
  },
  error: {
    icon: XCircle,
    bg: 'bg-white border-absent',
    iconColor: 'text-absent',
    titleColor: 'text-slate-800',
  },
  warning: {
    icon: AlertCircle,
    bg: 'bg-white border-leave',
    iconColor: 'text-leave',
    titleColor: 'text-slate-800',
  },
  info: {
    icon: Info,
    bg: 'bg-white border-primary-400',
    iconColor: 'text-primary-600',
    titleColor: 'text-slate-800',
  },
}

function ToastItem({ toast }: ToastItemProps) {
  const dismissToast = useAppStore(s => s.dismissToast)
  const [visible, setVisible] = useState(false)

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10)
    return () => clearTimeout(t)
  }, [])

  const config = toastConfig[toast.type]
  const Icon = config.icon

  return (
    <div
      className={`
        flex items-start gap-3 px-4 py-3 rounded-2xl shadow-elevated border-l-4
        transition-all duration-300
        ${config.bg}
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
      role="alert"
    >
      <Icon size={18} className={`shrink-0 mt-0.5 ${config.iconColor}`} />
      <p className={`flex-1 text-sm font-medium leading-snug ${config.titleColor}`}>
        {toast.message}
      </p>
      <button
        onClick={() => dismissToast(toast.id)}
        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// ─── Toast Container ──────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}