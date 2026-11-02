// Form for creating or editing the signed-in user's profile.
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import type { ProfileInput } from './api'
import { SUGGESTED_INTERESTS } from './interests'

type ProfileFormProps = {
  title: string
  initial?: ProfileInput
  onSave: (input: ProfileInput) => Promise<void>
  onCancel?: () => void
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

export function ProfileForm({ title, initial, onSave, onCancel }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '')
  const [major, setMajor] = useState(initial?.major ?? '')
  const [graduationYear, setGraduationYear] = useState(initial?.graduationYear?.toString() ?? '')
  const [interests, setInterests] = useState<string[]>(initial?.interests ?? [])
  const [newInterest, setNewInterest] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Compare without case so "finance" and "Finance" are treated as the same interest.
  function has(list: string[], value: string) {
    return list.some((item) => item.toLowerCase() === value.toLowerCase())
  }

  function addInterest(value: string) {
    const trimmed = value.trim()
    if (trimmed && !has(interests, trimmed)) {
      setInterests([...interests, trimmed])
    }
  }

  function removeInterest(interest: string) {
    setInterests(interests.filter((item) => item !== interest))
  }

  // Suggestions the user has not picked yet.
  const remainingSuggestions = SUGGESTED_INTERESTS.filter((suggestion) => !has(interests, suggestion))

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const name = displayName.trim()
    if (!name) {
      setError('Please enter your name.')
      return
    }

    let year: number | undefined
    if (graduationYear.trim()) {
      year = Number(graduationYear)
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        setError('Graduation year must be a four-digit year, like 2029.')
        return
      }
    }

    // Keep a half-typed interest instead of silently dropping it.
    const typed = newInterest.trim()
    const finalInterests = typed && !has(interests, typed) ? [...interests, typed] : interests

    setSaving(true)
    try {
      await onSave({
        displayName: name,
        major: major.trim() || undefined,
        graduationYear: year,
        interests: finalInterests,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block text-sm font-medium">
          Name
          <input
            className={`${inputClass} mt-1`}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            maxLength={80}
          />
        </label>

        <label className="block text-sm font-medium">
          Major (optional)
          <input
            className={`${inputClass} mt-1`}
            value={major}
            onChange={(event) => setMajor(event.target.value)}
            placeholder="Mechanical Engineering"
            maxLength={80}
          />
        </label>

        <label className="block text-sm font-medium">
          Graduation year (optional)
          <input
            className={`${inputClass} mt-1`}
            value={graduationYear}
            onChange={(event) => setGraduationYear(event.target.value)}
            placeholder="2029"
            inputMode="numeric"
            maxLength={4}
          />
        </label>

        <div>
          <h3 className="text-sm font-medium">Interests</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            These decide what shows up in your Discover feed. Pick from the list so events can match.
          </p>

          {interests.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {interests.map((interest) => (
                <span
                  key={interest}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-ink"
                >
                  {interest}
                  <button
                    type="button"
                    aria-label={`Remove ${interest}`}
                    onClick={() => removeInterest(interest)}
                    className="rounded-full hover:text-red-700"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {remainingSuggestions.length > 0 && (
            <>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Suggested</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {remainingSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addInterest(suggestion)}
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
              className={inputClass}
              value={newInterest}
              onChange={(event) => setNewInterest(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  addInterest(newInterest)
                  setNewInterest('')
                }
              }}
              placeholder="Something not on the list"
              maxLength={40}
            />
            <Button
              variant="secondary"
              onClick={() => {
                addInterest(newInterest)
                setNewInterest('')
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
          {onCancel && (
            <Button variant="secondary" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
