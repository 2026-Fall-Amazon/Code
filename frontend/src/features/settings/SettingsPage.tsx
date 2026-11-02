// Settings (side menu): account and notification preferences.
import { useAuthenticator } from '@aws-amplify/ui-react'
import { LogOut } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { Toggle } from '../../components/Toggle'
import { useCurrentUser } from '../../lib/session/hooks'
import { useNotifications } from '../notifications/NotificationProvider'
import { AdminTools, UserIdCard } from './AdminTools'

export function SettingsPage() {
  const { user, signOut } = useAuthenticator((context) => [context.user])
  const { isAdmin } = useCurrentUser()
  const {
    preferences,
    preferencesLoading,
    savingPreferences,
    savePreference,
    enableBrowserAlerts,
  } = useNotifications()
  const [preferenceError, setPreferenceError] = useState<string | null>(null)

  function save(key: keyof typeof preferences, value: boolean) {
    setPreferenceError(null)
    void savePreference(key, value).catch((error: unknown) => {
      setPreferenceError(error instanceof Error ? error.message : 'Could not save this preference.')
    })
  }

  function setBrowserAlerts(enabled: boolean) {
    if (!enabled) {
      save('browserAlerts', false)
      return
    }
    setPreferenceError(null)
    void enableBrowserAlerts().catch((error: unknown) => {
      setPreferenceError(error instanceof Error ? error.message : 'Could not enable desktop alerts.')
    })
  }

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
        <p className="mb-3 text-sm text-gray-600">Choose which club updates you want to see and where they should reach you.</p>
        {preferencesLoading ? (
          <p className="text-sm text-gray-600">Loading preferences...</p>
        ) : (
          <div className="divide-y divide-gray-100">
            <h3 className="pt-2 text-xs font-bold uppercase tracking-wide text-gray-500">In app</h3>
            <Toggle
              label="In-app announcements"
              description="Add new club announcements to your notification list."
              checked={preferences.inAppAnnouncements}
              disabled={savingPreferences}
              onChange={(value) => save('inAppAnnouncements', value)}
            />
            <Toggle
              label="In-app event updates"
              description="Alert me when a club posts, changes, or cancels an event."
              checked={preferences.inAppEvents}
              disabled={savingPreferences}
              onChange={(value) => save('inAppEvents', value)}
            />
            <Toggle
              label="In-app RSVP reminders"
              description="Remind me in the app about events I RSVP'd to, the day before."
              checked={preferences.inAppReminders}
              disabled={savingPreferences}
              onChange={(value) => save('inAppReminders', value)}
            />

            <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Email</h3>
            <Toggle
              label="Email announcements"
              description="Email me when a club I'm in posts an announcement."
              checked={preferences.emailAnnouncements}
              disabled={savingPreferences}
              onChange={(value) => save('emailAnnouncements', value)}
            />
            <Toggle
              label="Email event updates"
              description="Email me about new, changed, and cancelled club events."
              checked={preferences.emailEvents}
              disabled={savingPreferences}
              onChange={(value) => save('emailEvents', value)}
            />
            <Toggle
              label="Email RSVP reminders"
              description="Email me the day before an event I RSVP'd to."
              checked={preferences.emailReminders}
              disabled={savingPreferences}
              onChange={(value) => save('emailReminders', value)}
            />
            <Toggle
              label="Weekly digest"
              description="Send a Sunday summary of this week's in-app club updates."
              checked={preferences.weeklyDigest}
              disabled={savingPreferences}
              onChange={(value) => save('weeklyDigest', value)}
            />

            <h3 className="pt-4 text-xs font-bold uppercase tracking-wide text-gray-500">Desktop</h3>
            <Toggle
              label="Browser alerts"
              description="Show desktop alerts for new updates while this app is open."
              checked={preferences.browserAlerts}
              disabled={savingPreferences}
              onChange={setBrowserAlerts}
            />
          </div>
        )}
        {preferenceError && <p role="alert" className="mt-2 text-sm text-red-700">{preferenceError}</p>}
        <p className="mt-3 text-xs text-gray-500">
          Email alerts require the app's verified sender address to be configured in AWS.
        </p>
      </Card>

      <UserIdCard />

      {isAdmin && (
        <>
          <h2 className="pt-2 text-lg font-bold">Admin tools</h2>
          <AdminTools />
        </>
      )}
    </div>
  )
}
