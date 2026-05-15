import type { ReactNode } from 'react'
import type { AttendanceStatus } from '@/types'
import { ATTENDANCE_STATUS_CONFIG } from '@/types'

// ─── Generic Badge ────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray'
  size?: 'sm' | 'md'
  dot?: boolean
}

const badgeColorMap = {
  blue:   'bg-primary-50 text-primary-700',
  green:  'bg-present-light text-present-dark',
  red:    'bg-absent-light text-absent-dark',
  yellow: 'bg-leave-light text-leave-dark',
  purple: 'bg-holiday-light text-holiday-dark',
  gray:   'bg-slate-100 text-slate-600',
}

const dotColorMap = {
  blue:   'bg-primary-500',
  green:  'bg-present',
  red:    'bg-absent',
  yellow: 'bg-leave',
  purple: 'bg-holiday',
  gray:   'bg-slate-400',
}

export function Badge({ children, color = 'gray', size = 'md', dot = false }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-medium rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      ${badgeColorMap[color]}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColorMap[color]}`} />
      )}
      {children}
    </span>
  )
}

// ─── Attendance Status Badge ──────────────────────────────────────────────────

interface StatusBadgeProps {
  status: AttendanceStatus
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

const statusColorOverride: Record<AttendanceStatus, string> = {
  present: 'bg-present-light text-present-dark',
  absent:  'bg-absent-light text-absent-dark',
  leave:   'bg-leave-light text-leave-dark',
  holiday: 'bg-holiday-light text-holiday-dark',
}

export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const config = ATTENDANCE_STATUS_CONFIG[status]
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span className={`
      inline-flex items-center font-semibold rounded-full
      ${sizeStyles[size]}
      ${statusColorOverride[status]}
    `}>
      {showLabel ? config.label : config.shortLabel}
    </span>
  )
}

// ─── Attendance Toggle Button ─────────────────────────────────────────────────
// Used in the mark attendance screen

interface AttendanceToggleProps {
  status: AttendanceStatus | null
  targetStatus: AttendanceStatus
  onSelect: (status: AttendanceStatus) => void
  disabled?: boolean
}

const toggleActiveStyles: Record<AttendanceStatus, string> = {
  present: 'bg-present text-white shadow-soft',
  absent:  'bg-absent text-white shadow-soft',
  leave:   'bg-leave text-white shadow-soft',
  holiday: 'bg-holiday text-white shadow-soft',
}

const toggleInactiveStyles: Record<AttendanceStatus, string> = {
  present: 'bg-present-light text-present-dark hover:bg-present/20',
  absent:  'bg-absent-light text-absent-dark hover:bg-absent/20',
  leave:   'bg-leave-light text-leave-dark hover:bg-leave/20',
  holiday: 'bg-holiday-light text-holiday-dark hover:bg-holiday/20',
}

export function AttendanceToggle({
  status,
  targetStatus,
  onSelect,
  disabled = false,
}: AttendanceToggleProps) {
  const config = ATTENDANCE_STATUS_CONFIG[targetStatus]
  const isActive = status === targetStatus

  return (
    <button
      onClick={() => !disabled && onSelect(targetStatus)}
      disabled={disabled}
      className={`
        w-9 h-9 rounded-xl font-bold text-sm
        transition-all duration-150
        ${disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'active:scale-90 cursor-pointer'
        }
        ${isActive
          ? toggleActiveStyles[targetStatus]
          : toggleInactiveStyles[targetStatus]
        }
      `}
      aria-label={config.label}
      aria-pressed={isActive}
    >
      {config.shortLabel}
    </button>
  )
}

// ─── Attendance Percentage Badge ──────────────────────────────────────────────

interface PercentageBadgeProps {
  percentage: number
  size?: 'sm' | 'md'
}

export function PercentageBadge({ percentage, size = 'md' }: PercentageBadgeProps) {
  const color =
    percentage >= 85 ? 'bg-present-light text-present-dark' :
    percentage >= 75 ? 'bg-leave-light text-leave-dark' :
                       'bg-absent-light text-absent-dark'

  return (
    <span className={`
      inline-flex items-center font-semibold rounded-full
      ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'}
      ${color}
    `}>
      {percentage}%
    </span>
  )
}