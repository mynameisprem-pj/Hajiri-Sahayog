import type { HTMLAttributes, ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
  pressable?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

const paddingStyles = {
  none: '',
  sm:   'p-3',
  md:   'p-4',
  lg:   'p-5',
}

export function Card({
  children,
  padding = 'md',
  hoverable = false,
  pressable = false,
  className = '',
  onClick,
  ...props
}: CardProps) {
  const isInteractive = hoverable || pressable || !!onClick

  return (
    <div
      onClick={onClick}
      className={[
        'bg-white rounded-2xl shadow-card',
        paddingStyles[padding],
        isInteractive
          ? 'cursor-pointer transition-all duration-150'
          : '',
        hoverable  ? 'hover:shadow-elevated hover:-translate-y-0.5' : '',
        pressable  ? 'active:scale-[0.98] active:shadow-soft' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Card Header ──────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
  icon?: ReactNode
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-slate-800 text-base leading-tight truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number | string
  color: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
  icon?: ReactNode
  className?: string
}

const statColorMap = {
  blue:   { bg: 'bg-primary-50',  text: 'text-primary-700',  value: 'text-primary-800' },
  green:  { bg: 'bg-present-light', text: 'text-present-dark', value: 'text-present-dark' },
  red:    { bg: 'bg-absent-light',  text: 'text-absent-dark',  value: 'text-absent-dark' },
  yellow: { bg: 'bg-leave-light',   text: 'text-leave-dark',   value: 'text-leave-dark' },
  purple: { bg: 'bg-holiday-light', text: 'text-holiday-dark', value: 'text-holiday-dark' },
}

export function StatCard({ label, value, color, icon, className = '' }: StatCardProps) {
  const colors = statColorMap[color]
  return (
    <div className={`${colors.bg} rounded-2xl p-3 flex flex-col gap-1 ${className}`}>
      {icon && (
        <div className={`${colors.text} mb-0.5`}>{icon}</div>
      )}
      <span className={`text-2xl font-bold ${colors.value}`}>{value}</span>
      <span className={`text-xs font-medium ${colors.text}`}>{label}</span>
    </div>
  )
}