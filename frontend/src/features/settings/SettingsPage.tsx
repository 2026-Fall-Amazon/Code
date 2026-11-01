// Settings (side menu): account and notification preferences.
//
// To build:
// - Save notification preferences (needs a new field or model).
// - Email alerts and event reminders are "if time allows" in the product overview.
import { useAuthenticator } from '@aws-amplify/ui-react'
import { LogOut } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { Toggle } from '../../components/Toggle'

export function SettingsPage() {
  const { user, signOut } = useAuthenticator((context) => [context.user])

  return (
    <div className="space-y-4">
      <PageHeader title="Settings" />

      <Card>
        <CardTitle>Account</CardTitle>
        <p className="text-sm text-gray-600">Signed in as</p>
        <p className="font-medium">{user?.signInDetails?.loginId}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/profile"
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Edit profile
          </Link>
          <Button variant="secondary" onClick={signOut}>
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </Card>

      <Card>
        <CardTitle>Notifications</CardTitle>
        <div className="divide-y divide-gray-100">
          <Toggle label="New announcements" description="Email me when a club I'm in posts an announcement." defaultOn />
          <Toggle label="Event reminders" description="Email me the day before an event I RSVP'd to." defaultOn />
          <Toggle label="New events from my clubs" description="Email me when a club I'm in posts an event." />
        </div>
      </Card>
    </div>
  )
}
