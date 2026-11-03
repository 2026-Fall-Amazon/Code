import { Bell, Menu, Search } from 'lucide-react'
import { Link } from 'react-router'
import { BrandName } from '../components/BrandName'
import { useNotifications } from '../features/notifications/NotificationProvider'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { unreadCount } = useNotifications()

  return (
    <header className="sticky top-0 z-30 bg-squid text-white">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          className="rounded-md p-1.5 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Menu size={24} />
        </button>
        <Link to="/" className="text-lg font-bold tracking-tight">
          <BrandName />
        </Link>

        {/* Wide screens: a search field that opens the Clubs page. */}
        <Link
          to="/clubs"
          className="ml-auto hidden h-9 w-80 overflow-hidden rounded-md bg-white text-sm text-gray-500 md:flex"
        >
          <span className="flex flex-1 items-center px-3">Search clubs</span>
          <span className="flex w-11 items-center justify-center bg-brand-soft text-squid hover:bg-brand">
            <Search size={18} aria-hidden="true" />
          </span>
        </Link>
        <Link
          to="/notifications"
          aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
          className="relative rounded-md p-1.5 hover:bg-white/10"
        >
          <Bell size={22} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-squid">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Link>
        <Link to="/clubs" aria-label="Search clubs" className="ml-auto rounded-md p-1.5 hover:bg-white/10 md:hidden">
          <Search size={22} />
        </Link>
      </div>
    </header>
  )
}
