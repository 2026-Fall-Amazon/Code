// Edit form for a profile that already exists.
// First-time users get the three-step wizard in ProfileSetup instead, because
// walking three screens to fix a typo would be worse than one form.
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import type { ProfileInput } from './api'
import { FormError, GraduationYearField, MajorField } from './fields'
import { inputClass, validateGraduationYear } from './formUtils'
import { InterestPicker } from './InterestPicker'

type ProfileFormProps = {
  initial: ProfileInput
  onSave: (input: ProfileInput) => Promise<void>
  onCancel: () => void
}

export function ProfileForm({ initial, onSave, onCancel }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [major, setMajor] = useState(initial.major ?? '')
  const [graduationYear, setGraduationYear] = useState(initial.graduationYear?.toString() ?? '')
  const [interests, setInterests] = useState<string[]>(initial.interests)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const name = displayName.trim()
    if (!name) {
      setError('Please enter your name.')
      return
    }

    if (!major.trim()) {
      setError('Please enter your major, or choose "I haven\'t decided yet".')
      return
    }

    const yearError = validateGraduationYear(graduationYear)
    if (yearError) {
      setError(yearError)
      return
    }

    setSaving(true)
    try {
      await onSave({
        displayName: name,
        major: major.trim(),
        graduationYear: Number(graduationYear),
        interests,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardTitle>Edit profile</CardTitle>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="display-name" className="block text-sm font-medium">
            Name
          </label>
          <input
            id="display-name"
            className={`${inputClass} mt-1`}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Your name"
            maxLength={80}
          />
        </div>

        <MajorField value={major} onChange={setMajor} />
        <GraduationYearField value={graduationYear} onChange={setGraduationYear} />

        <div>
          <h3 className="text-sm font-medium">Interests</h3>
          <p className="mt-0.5 text-xs text-gray-500">
            These decide what shows up in your Discover feed. Pick from the list so events can match.
          </p>
          <div className="mt-2">
            <InterestPicker value={interests} onChange={setInterests} />
          </div>
        </div>

        {error && <FormError>{error}</FormError>}

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save profile'}
          </Button>
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
