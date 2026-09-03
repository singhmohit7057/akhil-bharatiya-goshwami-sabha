import { useState, useEffect } from 'react'

interface Props {
  value: string // YYYY-MM-DD
  onChange: (val: string) => void // returns YYYY-MM-DD
  required?: boolean
  className?: string
}

export function DateMaskInput({ value, onChange, required, className }: Props) {
  const toDisplay = (iso: string) => {
    if (!iso) return ''
    const [y, m, d] = iso.split('-')
    if (d) return `${d}-${m}-${y}`
    if (m) return `${d || ''}-${m}`
    return ''
  }

  const [display, setDisplay] = useState(toDisplay(value))

  useEffect(() => {
    setDisplay(toDisplay(value))
  }, [value])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value.replace(/[^0-9]/g, '')
    let formatted = ''

    if (raw.length >= 1) formatted = raw.substring(0, 2)
    if (raw.length >= 3) formatted += '-' + raw.substring(2, 4)
    if (raw.length >= 5) formatted += '-' + raw.substring(4, 8)

    setDisplay(formatted)

    // Convert to YYYY-MM-DD for storage
    if (raw.length === 8) {
      const d = raw.substring(0, 2)
      const m = raw.substring(2, 4)
      const y = raw.substring(4, 8)
      onChange(`${y}-${m}-${d}`)
    } else {
      onChange('')
    }
  }

  return (
    <input
      type="text"
      required={required}
      value={display}
      onChange={handleChange}
      placeholder="DD-MM-YYYY"
      maxLength={10}
      className={className}
    />
  )
}
