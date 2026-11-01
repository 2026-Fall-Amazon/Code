import { House, Inbox, User } from 'lucide-react'
import { NavLink } from 'react-router'

const tabs = [
  { to: '/', label: 'Home', icon: House },
  { to: '/inbox', label: 'Inbox', icon: Inbox },
  { to: '/profile', label: 'Profile', icon: User },
]

export function BottomTabs() {
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 bg-squid pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex h-16 max-w-5xl">
        {tabs.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end
              className={({ isActive }) =>
                `flex h-full flex-col items-center justify-center gap-1 text-xs font-medium ${
                  isActive ? 'text-brand' : 'text-gray-300 hover:text-white'
                }`
              }
            >
              <Icon size={22} aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
