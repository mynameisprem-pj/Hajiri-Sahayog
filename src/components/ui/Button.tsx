import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children?: ReactNode
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantStyles: Record<Variant, string> = {
  primary:   'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-soft disabled:bg-primary-300',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300 disabled:bg-slate-50 disabled:text-slate-400',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200 disabled:text-slate-300',
  danger:    'bg-absent text-white hover:bg-red-600 active:bg-red-700 shadow-soft disabled:bg-red-300',
  success:   'bg-present text-white hover:bg-emerald-600 active:bg-emerald-700 shadow-soft disabled:bg-emerald-300',
}

const sizeStyles: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3 text-base rounded-xl gap-2',
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 active:scale-95',
        'disabled:cursor-not-allowed disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-1',
        'no-select',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin shrink-0" />
      ) : (
        icon && iconPosition === 'left' && (
          <span className="shrink-0">{icon}</span>
        )
      )}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'

// ─── Icon Button ──────────────────────────────────────────────────────────────

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  label: string // for accessibility
  variant?: Variant
  size?: Size
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}, ref) => {
  const sizeMap: Record<Size, string> = {
    sm: 'p-1.5 rounded-lg',
    md: 'p-2 rounded-xl',
    lg: 'p-2.5 rounded-xl',
  }

  return (
    <button
      ref={ref}
      aria-label={label}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center',
        'transition-all duration-150 active:scale-95',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
        'no-select',
        variantStyles[variant],
        sizeMap[size],
        className,
      ].join(' ')}
      {...props}
    >
      {icon}
    </button>
  )
})

IconButton.displayName = 'IconButton'