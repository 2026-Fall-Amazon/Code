import { Bell, CalendarDays, Compass, MessageCircle, Settings, Users, X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { NavLink } from 'react-router'
import { ConceptBadge } from '../components/Concept'
import { useCurrentUser, useMyClubs } from '../lib/session/hooks'
import { useNotifications } from '../features/notifications/NotificationProvider'

type SideMenuProps = {
  open: boolean
  onClose: () => void
}

export function SideMenu({ open, onClose }: SideMenuProps) {
  const { displayName } = useCurrentUser()
  const { myClubs, loading } = useMyClubs()
  const { unreadCount } = useNotifications()

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open, onClose])

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        aria-label="Side menu"
        inert={!open}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-lg transition-transform ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center justify-between bg-squid px-4 text-white">
          <span className="font-bold">Hello, {displayName.split(' ')[0]}</span>
          <button type="button" onClick={onClose} aria-label="Close menu" className="rounded-md p-1.5 hover:bg-white/10">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <MenuSection title="Explore">
            <MenuLink
              to="/notifications"
              icon={<Bell size={18} />}
              onClick={onClose}
              badge={unreadCount > 0 ? <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-bold">{unreadCount}</span> : undefined}
            >
              Notifications
            </MenuLink>
            <MenuLink to="/discover" icon={<Compass size={18} />} onClick={onClose}>
              Discover
            </MenuLink>
            <MenuLink to="/calendar" icon={<CalendarDays size={18} />} onClick={onClose}>
              Calendar
            </MenuLink>
            <MenuLink to="/clubs" icon={<Users size={18} />} onClick={onClose}>
              Clubs
            </MenuLink>
            <MenuLink to="/messages" icon={<MessageCircle size={18} />} onClick={onClose} badge={<ConceptBadge />}>
              Messages
            </MenuLink>
          </MenuSection>

          <MenuSection title="Your clubs">
            {myClubs.map(({ club }) => (
              <MenuLink key={club.id} to={`/clubs/${club.id}`} onClick={onClose}>
                {club.name}
              </MenuLink>
            ))}
            {!loading && myClubs.length === 0 && (
              <li className="px-4 py-2 text-sm text-gray-500">
                You haven't joined any clubs yet.
              </li>
            )}
          </MenuSection>

          <MenuSection title="Settings">
            <MenuLink to="/settings" icon={<Settings size={18} />} onClick={onClose}>
              Account and notifications
            </MenuLink>
          </MenuSection>
        </nav>
      </aside>
    </>
  )
}

function MenuSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="py-2">
      <h2 className="px-4 pb-1 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h2>
      <ul>{children}</ul>
    </div>
  )
}

type MenuLinkProps = {
  to: string
  children: ReactNode
  onClick: () => void
  icon?: ReactNode
  badge?: ReactNode
}

function MenuLink({ to, children, onClick, icon, badge }: MenuLinkProps) {
  return (
    <li>
      <NavLink
        to={to}
        end
        onClick={onClick}
        className={({ isActive }) =>
          `flex items-center gap-3 border-l-4 px-4 py-2.5 text-sm ${
            isActive ? 'border-brand bg-brand/10 font-semibold' : 'border-transparent hover:bg-page'
          }`
        }
      >
        {icon}
        <span className="flex-1">{children}</span>
        {badge}
      </NavLink>
    </li>
  )
}
