// Stands between sign-in and the app.
//
// A brand new account has a Cognito user but no UserProfile record, so pages
// would render with no name, major or interests. This gate blocks the app until
// that record exists, which is why Home never flashes with empty data.
//
// It reads the profile from SessionProvider rather than fetching its own, so it
// must be rendered inside <SessionProvider>. Once a profile exists this renders
// its children and is never seen again.
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { fetchUserAttributes } from 'aws-amplify/auth'
import { useCurrentUser } from '../../lib/session/hooks'
import { saveMyProfile } from './api'
import type { ProfileInput } from './api'
import { ProfileSetup } from './ProfileSetup'

export function ProfileGate({ children }: { children: ReactNode }) {
  const { profile, email, loading, error, refreshProfile } = useCurrentUser()
  // The name typed at sign-up, used to pre-fill the first setup screen.
  const [accountName, setAccountName] = useState('')

  useEffect(() => {
    let cancelled = false
    // Accounts created before sign-up asked for a name have none, so this can
    // come back empty and the field just starts blank.
    fetchUserAttributes()
      .then((attributes) => {
        if (!cancelled) setAccountName(attributes.name ?? '')
      })
      .catch(() => {
        // Not worth blocking setup over; the user can type their name.
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(input: ProfileInput) {
    await saveMyProfile(input)
    // Tell the rest of the app about the new profile, which also lets this gate through.
    await refreshProfile()
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  if (error) {
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

  if (!profile) {
    return <ProfileSetup initialName={accountName} email={email} onSave={handleSave} />
  }

  return <>{children}</>
}
