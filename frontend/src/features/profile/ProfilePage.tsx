// Profile tab: name, class year, interest tags, and the user's clubs.
//
// Done: reads the profile from the shared session (SessionProvider loads it once)
// and saves edits through saveMyProfile, then refreshProfile() so the side menu
// and other pages pick up the new name.
// "Your clubs" is real data from useMyClubs().
// Interests feed the Discover ranking.
// Waiting on the backend deploy: bio, and the profile picture upload.
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { Tag } from '../../components/Tag'
import { useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { saveMyProfile } from './api'
import type { ProfileInput } from './api'
import { ProfileForm } from './ProfileForm'

// "November 2026". Kept local to this feature so lib/format.ts stays untouched.
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' })

// RoleBadge in components/ only knows member and officer, and MyRole has three
// values, so the badge is rendered here instead of changing a shared component.
const roleLabels = { leader: 'Leader', poster: 'Poster', member: 'Member' } as const

function MyRoleBadge({ role }: { role: keyof typeof roleLabels }) {
  const highlighted = role !== 'member'
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${
        highlighted ? 'bg-squid font-semibold text-brand' : 'bg-page font-medium text-gray-700'
      }`}
    >
      {roleLabels[role]}
    </span>
  )
}

export function ProfilePage() {
  const { profile, email, refreshProfile } = useCurrentUser()
  const { myClubs, loading: clubsLoading } = useMyClubs()
  const [editing, setEditing] = useState(false)

  async function handleSave(input: ProfileInput) {
    await saveMyProfile(input, profile?.id)
    await refreshProfile()
    setEditing(false)
  }

  // ProfileGate guarantees a profile exists before the app loads, so this should
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
        <CardTitle
          action={
            !clubsLoading && <span className="text-sm font-normal text-gray-500">{myClubs.length} joined</span>
          }
        >
          Your clubs
        </CardTitle>
        {clubsLoading ? (
          <p className="text-sm text-gray-500">Loading your clubs...</p>
        ) : myClubs.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {myClubs.map(({ club, role }) => (
              <li key={club.id}>
                <Link to={`/clubs/${club.id}`} className="flex items-center justify-between py-3 hover:underline">
                  <span className="font-medium">{club.name}</span>
                  <MyRoleBadge role={role} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            You have not joined any clubs yet.{' '}
            <Link to="/clubs" className="font-medium text-ink underline">
              Browse clubs
            </Link>
            .
          </p>
        )}
      </Card>
    </div>
  )
}
