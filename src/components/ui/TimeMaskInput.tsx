import { useState, useEffect } from 'react'

interface Props {
  value: string // HH:MM (24hr for storage)
  onChange: (val: string) => void // returns HH:MM 24hr
  className?: string
}

function to12hr(time24: string): { display: string; ampm: 'AM' | 'PM' } {
  if (!time24) return { display: '', ampm: 'AM' }
  const [h, m] = time24.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return { display: `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')}`, ampm }
}

function to24hr(display: string, ampm: 'AM' | 'PM'): string {
  if (!display || display.length < 5) return ''
  const [h, m] = display.split(':').map(Number)
  let h24 = h
  if (ampm === 'AM' && h === 12) h24 = 0
  else if (ampm === 'PM' && h !== 12) h24 = h + 12
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function TimeMaskInput({ value, onChange, className }: Props) {
  const { display: initDisplay, ampm: initAmpm } = to12hr(value)
  const [display, setDisplay] = useState(initDisplay)
  const [ampm, setAmpm] = useState<'AM' | 'PM'>(initAmpm)

  useEffect(() => {
    const { display: d, ampm: a } = to12hr(value)
    setDisplay(d)
    setAmpm(a)
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^0-9]/g, '')
    let formatted = ''
    if (raw.length >= 1) formatted = raw.substring(0, 2)
    if (raw.length >= 3) formatted += ':' + raw.substring(2, 4)
    setDisplay(formatted)
    if (raw.length >= 4) {
      onChange(to24hr(raw.substring(0, 2) + ':' + raw.substring(2, 4), ampm))
    } else {
      onChange('')
    }
  }

  function handleAmpm(val: 'AM' | 'PM') {
    setAmpm(val)
    if (display.length === 5) {
      onChange(to24hr(display, val))
    }
  }

  return (
    <div className="flex gap-1">
      <input
        type="text"
        value={display}
        onChange={handleChange}
        placeholder="HH:MM"
        maxLength={5}
        className={`${className} flex-1 min-w-0`}
      />
      <div className="flex border border-border rounded-lg overflow-hidden shrink-0">
        <button type="button" onClick={() => handleAmpm('AM')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${ampm === 'AM' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-gray-50'}`}>
          AM
        </button>
        <button type="button" onClick={() => handleAmpm('PM')}
          className={`px-2 py-1 text-xs font-medium transition-colors ${ampm === 'PM' ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-gray-50'}`}>
          PM
        </button>
      </div>
    </div>
  )
}
