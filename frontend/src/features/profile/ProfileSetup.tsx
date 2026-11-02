// First-run setup, shown full screen by ProfileGate before the app loads.
//
// Screen 1 is required: name, major and graduation year. Name arrives pre-filled
// from the Cognito account, so most people just confirm it.
// Screen 2 is skippable: interests, which only affect Discover ranking.
//
// Everything saves in one call at the end, so an abandoned setup leaves no half record.
import { useState } from 'react'
import { Button } from '../../components/Button'
import type { ProfileInput } from './api'
import { FormError, GraduationYearField, MajorField } from './fields'
import { inputClass, validateGraduationYear } from './formUtils'
import { InterestPicker } from './InterestPicker'

const TOTAL_SCREENS = 2

type ProfileSetupProps = {
  initialName?: string
  email?: string
  onSave: (input: ProfileInput) => Promise<void>
}

export function ProfileSetup({ initialName, email, onSave }: ProfileSetupProps) {
  const [screen, setScreen] = useState(1)
  const [displayName, setDisplayName] = useState(initialName ?? '')
  const [major, setMajor] = useState('')
  const [graduationYear, setGraduationYear] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function goNext() {
    setError(null)

    if (!displayName.trim()) {
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

    setScreen(2)
  }

  async function finish() {
    setError(null)
    setSaving(true)
    try {
      await onSave({
        displayName: displayName.trim(),
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
    <div className="min-h-screen bg-page">
      <header className="bg-squid px-4 py-3">
        <span className="font-bold text-white">Welcome</span>
      </header>

      <main className="mx-auto max-w-lg p-4">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-4 flex gap-1.5" aria-hidden="true">
            {Array.from({ length: TOTAL_SCREENS }, (_, index) => (
              <div key={index} className={`h-1 flex-1 rounded-full ${index < screen ? 'bg-brand' : 'bg-gray-200'}`} />
            ))}
          </div>

          {screen === 1 ? (
            <>
              <h1 className="text-xl font-bold">Tell us about yourself</h1>
              <p className="mt-1 text-sm text-gray-600">
                We need a few details before you get started. This takes about a minute.
              </p>

              <div className="mt-5 space-y-4">
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
                  {initialName && <p className="mt-1 text-xs text-gray-500">From your account. Change it if you like.</p>}
                </div>

                {email && (
                  <div>
                    <p className="block text-sm font-medium">Email</p>
                    <p className="mt-1 rounded-md bg-page px-3 py-2 text-sm text-gray-600">{email}</p>
                  </div>
                )}

                <MajorField value={major} onChange={setMajor} />
                <GraduationYearField value={graduationYear} onChange={setGraduationYear} />

                {error && <FormError>{error}</FormError>}

                <Button onClick={goNext}>Continue</Button>
              </div>
            </>
          ) : (
            <>
              <h1 className="text-xl font-bold">What are you interested in?</h1>
              <p className="mt-1 text-sm text-gray-600">
                These decide which events and clubs show up in your Discover feed. You can change them any time.
              </p>

              <div className="mt-5 space-y-4">
                <InterestPicker value={interests} onChange={setInterests} />

                {error && <FormError>{error}</FormError>}

                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={() => setScreen(1)} disabled={saving}>
                    Back
                  </Button>
                  <Button onClick={finish} disabled={saving}>
                    {saving ? 'Saving...' : interests.length > 0 ? 'Finish' : 'Skip for now'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
