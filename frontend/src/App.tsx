import { Navigate, Route, Routes } from 'react-router'
import { CalendarPage } from './features/calendar/CalendarPage'
import { ClubPage } from './features/clubs/ClubPage'
import { ClubsPage } from './features/clubs/ClubsPage'
import { DiscoverPage } from './features/discover/DiscoverPage'
import { HomePage } from './features/home/HomePage'
import { InboxPage } from './features/inbox/InboxPage'
import { MessagesPage } from './features/messages/MessagesPage'
import { NotificationsPage } from './features/notifications/NotificationsPage'
import { ProfilePage } from './features/profile/ProfilePage'
import { SettingsPage } from './features/settings/SettingsPage'
import { AppLayout } from './layout/AppLayout'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Bottom tabs */}
        <Route index element={<HomePage />} />
        <Route path="inbox" element={<InboxPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        {/* Side menu */}
        <Route path="discover" element={<DiscoverPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="clubs" element={<ClubsPage />} />
        <Route path="clubs/:clubId" element={<ClubPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="settings" element={<SettingsPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
