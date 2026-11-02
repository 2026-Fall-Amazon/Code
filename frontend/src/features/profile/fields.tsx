// Small form pieces shared by the setup wizard and the edit form.
import type { ReactNode } from 'react'
import { graduationYearChoices, inputClass } from './formUtils'

export function MajorField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div>
      <label htmlFor="major" className="block text-sm font-medium">
        Major
      </label>
      <input
        id="major"
        className={`${inputClass} mt-1`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Mechanical Engineering"
        maxLength={80}
      />
      <button
        type="button"
        onClick={() => onChange('Undecided')}
        className="mt-1.5 text-xs font-medium text-gray-600 underline hover:text-ink"
      >
        I haven&apos;t decided yet
      </button>
    </div>
  )
}

export function GraduationYearField({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  return (
    <div>
      <label htmlFor="graduation-year" className="block text-sm font-medium">
        Graduation year
      </label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {graduationYearChoices().map((year) => {
          const selected = value === year.toString()
          return (
            <button
              key={year}
              type="button"
              onClick={() => onChange(year.toString())}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${
                selected ? 'border-brand bg-brand text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:bg-page'
              }`}
            >
              {year}
            </button>
          )
        })}
      </div>
      <input
        id="graduation-year"
        className={`${inputClass} mt-2`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Or type another year"
        inputMode="numeric"
        maxLength={4}
      />
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return <p className="text-sm text-red-600">{children}</p>
}
