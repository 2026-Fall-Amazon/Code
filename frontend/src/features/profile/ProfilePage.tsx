// Profile tab: name, class year, interest tags, and the user's clubs.
//
// Done: loads and saves the UserProfile model (name, major, graduation year, interests).
// New accounts get the three-step setup wizard; everyone else gets "Edit profile".
// Interests feed the Discover ranking.
// Still on mock data: the "Your clubs" card (needs Membership + a per-club role).
// Waiting on the backend deploy: bio, and the profile picture upload.
import { useEffect, useState } from 'react'
import { useAuthenticator } from '@aws-amplify/ui-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { RoleBadge, Tag } from '../../components/Tag'
import { myClubs } from '../../mock/data'
import { getMyProfile, saveMyProfile } from './api'
import type { ProfileInput, SavedProfile } from './api'
import { ProfileForm } from './ProfileForm'

// "November 2026". Kept local to this feature so lib/format.ts stays untouched.
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

export function ProfilePage() {
  const { user } = useAuthenticator((context) => [context.user])
  const [profile, setProfile] = useState<SavedProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)

  const email = user?.signInDetails?.loginId

  useEffect(() => {
    let cancelled = false
    getMyProfile()
      .then((result) => {
        if (!cancelled) setProfile(result)
      })
      .catch((err) => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load your profile.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(input: ProfileInput) {
    const saved = await saveMyProfile(input, profile?.id)
    setProfile(saved)
    setEditing(false)
  }

  if (loading) {
    return <p className="p-4 text-sm text-gray-600">Loading your profile...</p>
  }

  if (loadError) {
    return (
      <Card>
        <p className="text-sm text-red-600">{loadError}</p>
      </Card>
    )
  }

  // ProfileGate guarantees a record exists before the app loads, so this should
  // not happen. Handled anyway rather than crashing on a blank page.
  if (!profile) {
    return (
      <Card>
        <p className="text-sm text-gray-600">No profile found. Try reloading the page.</p>
      </Card>
    )
  }

  if (editing) {
    return <ProfileForm initial={profile} onSave={handleSave} onCancel={() => setEditing(false)} />
  }

  const initials = profile.displayName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const details = [profile.graduationYear ? `Class of ${profile.graduationYear}` : null, profile.major || null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-squid text-xl font-bold text-brand">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{profile.displayName}</h1>
          {details && <p className="text-sm text-gray-600">{details}</p>}
          <p className="text-sm text-gray-500">{email}</p>
          {profile.createdAt && (
            <p className="text-xs text-gray-400">Member since {monthYear.format(new Date(profile.createdAt))}</p>
          )}
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          Edit profile
        </Button>
      </Card>

      <Card>
        <CardTitle>Interests</CardTitle>
        {profile.interests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <Tag key={interest}>{interest}</Tag>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No interests yet. Use Edit profile to add some.</p>
        )}
      </Card>

      <Card>
        <CardTitle action={<span className="text-sm font-normal text-gray-500">{myClubs().length} joined</span>}>
          Your clubs
        </CardTitle>
        <ul className="divide-y divide-gray-100">
          {myClubs().map(({ club, role }) => (
            <li key={club.id}>
              <Link to={`/clubs/${club.id}`} className="flex items-center justify-between py-3 hover:underline">
                <span className="font-medium">{club.name}</span>
                <RoleBadge role={role} />
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
