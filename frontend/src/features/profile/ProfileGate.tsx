// Stands between sign-in and the app.
//
// A brand new account has a Cognito user but no UserProfile record, so the rest
// of the app has no name, major or interests to show. This gate blocks the app
// until that record exists, which is why Home never flashes with empty data.
//
// Once a profile exists this renders its children and is never seen again.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchUserAttributes } from 'aws-amplify/auth'
import { getMyProfile, saveMyProfile } from './api'
import type { ProfileInput } from './api'
import { ProfileSetup } from './ProfileSetup'

type Status = 'loading' | 'setup' | 'ready' | 'error'

export function ProfileGate({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const [error, setError] = useState<string | null>(null)
  // Name and email come from the Cognito account, so setup can pre-fill them.
  const [accountName, setAccountName] = useState('')
  const [accountEmail, setAccountEmail] = useState<string | undefined>()

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const profile = await getMyProfile()
        if (cancelled) return

        // Older accounts were created before sign-up asked for a name, so this
        // can come back empty. The setup screen just starts blank in that case.
        try {
          const attributes = await fetchUserAttributes()
          if (!cancelled) {
            setAccountName(attributes.name ?? '')
            setAccountEmail(attributes.email)
          }
        } catch {
          // Not worth blocking setup over; the user can type their name.
        }

        if (!cancelled) setStatus(profile ? 'ready' : 'setup')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Could not load your profile.')
        setStatus('error')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(input: ProfileInput) {
    await saveMyProfile(input)
    setStatus('ready')
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page p-4">
        <div className="max-w-md rounded-lg bg-white p-6 text-center shadow-sm">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-md bg-brand px-4 py-2 text-sm font-medium text-gray-900 hover:bg-brand-hover"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (status === 'setup') {
    return <ProfileSetup initialName={accountName} email={accountEmail} onSave={handleSave} />
  }

  return <>{children}</>
}
