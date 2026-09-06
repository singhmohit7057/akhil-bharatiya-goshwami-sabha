import { useState, useRef, useEffect } from 'react'
import { Search, User, X } from 'lucide-react'
import { getRoleLabel } from '../../lib/utils'

interface Member {
  id: string
  full_name: string
  email?: string
  phone?: string
  role?: string
}

interface Props {
  members: Member[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  required?: boolean
}

export function MemberSelect({ members, value, onChange, placeholder = 'Choose member...', required }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = members.find((m) => m.id === value)

  const filtered = members.filter((m) => {
    if (!query) return true
    const q = query.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.phone?.includes(q) ||
      getRoleLabel(m.role || '').toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function handleOpen() {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full px-3 py-2 border rounded-lg text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white transition-colors ${
          open ? 'border-primary' : 'border-border hover:border-gray-300'
        }`}
      >
        {selected ? (
          <div className="flex-1 min-w-0">
            <span className="font-medium text-text-primary">{selected.full_name}</span>
            <span className="text-text-secondary ml-2 text-xs">{getRoleLabel(selected.role || '')}</span>
          </div>
        ) : (
          <span className="text-text-secondary">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {selected && (
            <span onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Hidden input for form validation */}
      {required && <input type="text" value={value} required readOnly className="sr-only" />}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          {/* Search */}
          <div className="px-3 py-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, email, phone, role..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-secondary">No members found</p>
            ) : filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelect(m.id)}
                className={`w-full px-4 py-2.5 text-left hover:bg-primary/5 transition-colors flex items-center gap-3 ${value === m.id ? 'bg-primary/10' : ''}`}
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{m.full_name}</p>
                  <p className="text-[11px] text-text-secondary truncate">
                    {[getRoleLabel(m.role || ''), m.phone, m.email].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
