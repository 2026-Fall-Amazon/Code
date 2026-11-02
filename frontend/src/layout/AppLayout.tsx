import { useState } from 'react'
import { Outlet } from 'react-router'
import { BottomTabs } from './BottomTabs'
import { SideMenu } from './SideMenu'
import { TopBar } from './TopBar'
import { NotificationProvider } from '../features/notifications/NotificationProvider'

// Every page renders inside this frame: sticky top bar, slide-out side menu,
// scrolling content in the middle, and the bottom tab bar.
export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <NotificationProvider>
      <div className="min-h-svh">
        <TopBar onMenuClick={() => setMenuOpen(true)} />
        <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
        <main className="mx-auto max-w-5xl px-4 pt-4 pb-24">
          <Outlet />
        </main>
        <BottomTabs />
      </div>
    </NotificationProvider>
  )
}
