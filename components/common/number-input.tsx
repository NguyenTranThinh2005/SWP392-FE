'use client'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  min?: number
  max?: number
  disabled?: boolean
}

// O nhap so cho phep xoa rong hoan toan (khong bi ket lai so 0)
export function NumberInput({ value, onChange, className, placeholder, min, max, disabled }: NumberInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      disabled={disabled}
      placeholder={placeholder}
      className={className}
      value={value === 0 ? '' : String(value)}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, '') // chi giu chu so
        if (raw === '') { onChange(0); return }           // xoa het -> 0 (nhung hien rong)
        let n = parseInt(raw, 10)
        if (min !== undefined && n < min) n = min
        if (max !== undefined && n > max) n = max
        onChange(n)
      }}
    />
  )
}