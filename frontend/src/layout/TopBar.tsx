import { Bell, Menu, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { BrandName } from '../components/BrandName'
import { useNotifications } from '../features/notifications/NotificationProvider'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function search(e: FormEvent) {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/clubs?q=${encodeURIComponent(q)}` : '/clubs')
    setQuery('')
  }

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

        {/* Wide screens: a search field. Enter opens the Clubs page with the results. */}
        <form
          role="search"
          onSubmit={search}
          className="ml-auto hidden h-9 w-80 overflow-hidden rounded-md bg-white text-sm text-ink focus-within:ring-2 focus-within:ring-brand md:flex"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clubs"
            aria-label="Search clubs"
            className="min-w-0 flex-1 px-3 outline-none placeholder:text-gray-500"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex w-11 items-center justify-center bg-brand-soft text-squid hover:bg-brand"
          >
            <Search size={18} aria-hidden="true" />
          </button>
        </form>
        {/* Narrow screens: an icon that opens the Clubs page, which has its own search box. */}
        <Link to="/clubs" aria-label="Search clubs" className="ml-auto rounded-md p-1.5 hover:bg-white/10 md:hidden">
          <Search size={22} />
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
      </div>
    </header>
  )
}
