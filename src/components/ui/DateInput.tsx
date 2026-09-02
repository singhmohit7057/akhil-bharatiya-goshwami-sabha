import { useState, useEffect } from 'react'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))

const MONTHS = [
  { value: '01', label: 'January' }, { value: '02', label: 'February' },
  { value: '03', label: 'March' }, { value: '04', label: 'April' },
  { value: '05', label: 'May' }, { value: '06', label: 'June' },
  { value: '07', label: 'July' }, { value: '08', label: 'August' },
  { value: '09', label: 'September' }, { value: '10', label: 'October' },
  { value: '11', label: 'November' }, { value: '12', label: 'December' },
]

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 100 }, (_, i) => String(currentYear - i))

export function DateInput({ value, onChange, required, className }: DateInputProps) {
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')

  useEffect(() => {
    if (value) {
      const parts = value.split('-')
      if (parts.length === 3) {
        setYear(parts[0])
        setMonth(parts[1])
        setDay(parts[2])
      }
    }
  }, [value])

  function emitChange(d: string, m: string, y: string) {
    if (d && m && y) {
      onChange(`${y}-${m}-${d}`)
    } else if (!d && !m && !y) {
      onChange('')
    }
  }

  const selectClass = 'border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white px-3 py-2.5 text-sm'

  return (
    <div className={`flex gap-2 ${className || ''}`}>
      <select
        value={day}
        required={required}
        onChange={(e) => { setDay(e.target.value); emitChange(e.target.value, month, year) }}
        className={`w-[72px] ${selectClass}`}
      >
        <option value="">Day</option>
        {DAYS.map((d) => (
          <option key={d} value={d}>{parseInt(d)}</option>
        ))}
      </select>
      <select
        value={month}
        required={required}
        onChange={(e) => { setMonth(e.target.value); emitChange(day, e.target.value, year) }}
        className={`w-[130px] ${selectClass}`}
      >
        <option value="">Month</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
      <select
        value={year}
        required={required}
        onChange={(e) => { setYear(e.target.value); emitChange(day, month, e.target.value) }}
        className={`w-[90px] ${selectClass}`}
      >
        <option value="">Year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
    </div>
  )
}
