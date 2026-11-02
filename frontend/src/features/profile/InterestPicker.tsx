// Tag picker for interests. Shared by the first-time setup wizard and the edit form.
import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../components/Button'
import { SUGGESTED_INTERESTS } from './interests'

type InterestPickerProps = {
  value: string[]
  onChange: (next: string[]) => void
}

// Compare without case so "finance" and "Finance" count as the same interest.
function has(list: string[], candidate: string) {
  return list.some((item) => item.toLowerCase() === candidate.toLowerCase())
}

export function InterestPicker({ value, onChange }: InterestPickerProps) {
  const [typed, setTyped] = useState('')

  function add(candidate: string) {
    const trimmed = candidate.trim()
    if (trimmed && !has(value, trimmed)) {
      onChange([...value, trimmed])
    }
    setTyped('')
  }

  const remaining = SUGGESTED_INTERESTS.filter((suggestion) => !has(value, suggestion))

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((interest) => (
            <span
              key={interest}
              className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-ink"
            >
              {interest}
              <button
                type="button"
                aria-label={`Remove ${interest}`}
                onClick={() => onChange(value.filter((item) => item !== interest))}
                className="rounded-full hover:text-red-700"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {remaining.length > 0 && (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested</p>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {remaining.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => add(suggestion)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-300 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:border-brand hover:bg-page"
              >
                <Plus size={12} />
                {suggestion}
              </button>
            ))}
          </div>
        </>
      )}

      <label htmlFor="new-interest" className="mt-3 block text-xs font-semibold uppercase tracking-wide text-gray-500">
        Add your own
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="new-interest"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add(typed)
            }
          }}
          placeholder="Something not on the list"
          maxLength={40}
        />
        <Button variant="secondary" onClick={() => add(typed)}>
          Add
        </Button>
      </div>
      {typed.trim() && (
        <p className="mt-1 text-xs text-gray-500">Press Enter or Add to keep &ldquo;{typed.trim()}&rdquo;.</p>
      )}
    </div>
  )
}
