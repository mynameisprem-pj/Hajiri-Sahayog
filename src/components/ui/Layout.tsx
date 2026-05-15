import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { LayoutDashboard, BookOpen, CalendarOff, Settings } from 'lucide-react'
import { useActiveTab, useAppStore } from '@/store/useAppStore'

// ─── Page Header ──────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string
  subtitle?: string
  onBack?: () => void
  action?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, onBack, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${className}`}>
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-surface-tertiary
                     active:scale-95 transition-all duration-150"
          aria-label="Go back"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div className="flex-1 min-w-0">
        <h1 className="text-xl font-bold text-slate-800 leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

// ─── Bottom Navigation ────────────────────────────────────────────────────────

const navItems = [
  {
    tab: 'dashboard' as const,
    label: 'Home',
    Icon: LayoutDashboard,
  },
  {
    tab: 'classes' as const,
    label: 'Classes',
    Icon: BookOpen,
  },
  {
    tab: 'holidays' as const,
    label: 'Holidays',
    Icon: CalendarOff,
  },
  {
    tab: 'settings' as const,
    label: 'Settings',
    Icon: Settings,
  },
]

export function BottomNav() {
  const activeTab = useActiveTab()
  const setActiveTab = useAppStore(s => s.setActiveTab)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 pb-safe">
      <div className="flex items-stretch max-w-lg mx-auto">
        {navItems.map(({ tab, label, Icon }) => {
          const isActive = activeTab === tab

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1
                py-2.5 transition-all duration-150 active:scale-95
                no-select
              `}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2.5 : 1.8}
                className={`transition-colors duration-150 ${
                  isActive ? 'text-primary-600' : 'text-slate-400'
                }`}
              />
              <span className={`text-[10px] font-medium transition-colors duration-150 ${
                isActive ? 'text-primary-600' : 'text-slate-400'
              }`}>
                {label}
              </span>

              {/* Active dot */}
              {isActive && (
                <span className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-primary-600" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-surface-tertiary flex items-center justify-center
                        text-slate-300 mb-4 text-3xl">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-600 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-400 mb-5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action}
    </div>
  )
}

// ─── Loading Spinner ──────────────────────────────────────────────────────────

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-surface-secondary flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-elevated">
          <span className="text-white text-2xl">📋</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

interface SectionLabelProps {
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function SectionLabel({ children, action, className = '' }: SectionLabelProps) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
        {children}
      </h2>
      {action}
    </div>
  )
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`border-t border-slate-100 ${className}`} />
}