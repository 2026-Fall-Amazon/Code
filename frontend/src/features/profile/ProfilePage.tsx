// Profile tab: name, class year, interest tags, and the user's clubs.
//
// To build:
// - Load and save the UserProfile model (displayName, major, graduationYear, interests).
// - "Edit profile" opens a form. Interests feed the Discover ranking.
import { useAuthenticator } from '@aws-amplify/ui-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { RoleBadge, Tag } from '../../components/Tag'
import { currentUser, myClubs } from '../../mock/data'

export function ProfilePage() {
  const { user } = useAuthenticator((context) => [context.user])
  const initials = currentUser.displayName
    .split(' ')
    .map((part) => part[0])
    .join('')

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-squid text-xl font-bold text-brand">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{currentUser.displayName}</h1>
          <p className="text-sm text-gray-600">
            Class of {currentUser.graduationYear} · {currentUser.major}
          </p>
          <p className="text-sm text-gray-500">{user?.signInDetails?.loginId}</p>
        </div>
        <Button variant="secondary">Edit profile</Button>
      </Card>

      <Card>
        <CardTitle>Interests</CardTitle>
        <div className="flex flex-wrap gap-2">
          {currentUser.interests.map((interest) => (
            <Tag key={interest}>{interest}</Tag>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Your clubs</CardTitle>
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
