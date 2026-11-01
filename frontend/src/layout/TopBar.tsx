import { Menu, Search } from 'lucide-react'
import { Link } from 'react-router'
import { APP_NAME } from '../config'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
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
          {APP_NAME}
          <span className="text-brand">.</span>
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
        <Link to="/clubs" aria-label="Search clubs" className="ml-auto rounded-md p-1.5 hover:bg-white/10 md:hidden">
          <Search size={22} />
        </Link>
      </div>
    </header>
  )
}
