import { useState } from 'react'

type ToggleProps = {
  label: string
  description?: string
  defaultOn?: boolean
  checked?: boolean
  disabled?: boolean
  onChange?: (on: boolean) => void
}

export function Toggle({ label, description, defaultOn = false, checked, disabled = false, onChange }: ToggleProps) {
  const [localOn, setLocalOn] = useState(defaultOn)
  const on = checked ?? localOn

  function toggle() {
    if (disabled) return
    const next = !on
    if (checked === undefined) setLocalOn(next)
    onChange?.(next)
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={toggle}
        disabled={disabled}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${on ? 'bg-brand' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${on ? 'translate-x-5' : ''}`}
        />
      </button>
    </div>
  )
}
