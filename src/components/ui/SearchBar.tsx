import { useRef, type ChangeEvent } from 'react'
import { Search, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus = false,
  className = '',
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleClear = () => {
    onChange('')
    inputRef.current?.focus()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <Search
        size={16}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="
          w-full pl-9 pr-9 py-2.5 rounded-xl
          bg-surface-tertiary border border-transparent
          text-sm text-slate-800 placeholder-slate-400
          focus:outline-none focus:border-primary-300 focus:bg-white focus:ring-2 focus:ring-primary-100
          transition-all duration-200
          [&::-webkit-search-cancel-button]:hidden
        "
      />

      {/* Clear Button */}
      {value.length > 0 && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400
                     hover:text-slate-600 transition-colors p-0.5 rounded-full
                     hover:bg-slate-200"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

// ─── useSearch Hook ───────────────────────────────────────────────────────────
// Generic hook for filtering a list by a search query

import { useState, useMemo } from 'react'

export function useSearch<T>(
  items: T[],
  getSearchText: (item: T) => string,
) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return items
    const q = query.toLowerCase().trim()
    return items.filter(item =>
      getSearchText(item).toLowerCase().includes(q)
    )
  }, [items, query, getSearchText])

  return { query, setQuery, filtered }
}