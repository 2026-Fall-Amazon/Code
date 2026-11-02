import { Bell, CheckCheck, Clock3, Megaphone } from 'lucide-react'
import { Link } from 'react-router'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { PageHeader } from '../../components/PageHeader'
import { useNotifications } from './NotificationProvider'

const dateLabel = (value?: string | null) => value ? new Date(value).toLocaleString() : 'Just now'

export function NotificationsPage() {
  const { notifications, unreadCount, loading, error, markRead, markAllRead } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const visibleNotifications = filter === 'unread' ? notifications.filter((item) => !item.readAt) : notifications

  return (
    <div className="space-y-4">
      <PageHeader
        title="Notifications"
        subtitle="Updates and reminders from your clubs"
        action={unreadCount > 0 && (
          <Button variant="secondary" onClick={() => void markAllRead().catch(() => undefined)}>
            <CheckCheck size={16} aria-hidden="true" />
            Mark all read
          </Button>
        )}
      />

      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!loading && notifications.length > 0 && (
        <div className="flex gap-2" aria-label="Filter notifications">
          {(['all', 'unread'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`rounded-full px-3 py-1 text-sm font-medium capitalize ${filter === value ? 'bg-squid text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
            >
              {value}{value === 'unread' ? ` (${unreadCount})` : ''}
            </button>
          ))}
        </div>
      )}
      {loading ? (
        <p>Loading notifications...</p>
      ) : notifications.length === 0 ? (
        <Card className="py-10 text-center">
          <Bell className="mx-auto mb-2 text-gray-400" aria-hidden="true" />
          <p className="font-semibold">You’re all caught up</p>
          <p className="mt-1 text-sm text-gray-600">New club announcements and events will show here.</p>
        </Card>
      ) : visibleNotifications.length === 0 ? (
        <Card className="py-8 text-center text-sm text-gray-600">You have no unread notifications.</Card>
      ) : (
        <ul className="space-y-2">
          {visibleNotifications.map((item) => (
            <li key={item.id}>
              <Card className={`p-0 ${item.readAt ? '' : 'border-brand/50 bg-brand/5'}`}>
                <div className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-squid-light text-squid">
                    {item.kind === 'announcement' ? <Megaphone size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{item.title}</p>
                    {item.clubName && <p className="text-xs font-medium text-gray-500">{item.clubName}</p>}
                    <p className="mt-0.5 text-sm text-gray-700">{item.body}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Clock3 size={13} aria-hidden="true" />
                      {dateLabel(item.occurredAt)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-3 text-sm">
                      <Link
                        to={item.target}
                        onClick={() => !item.readAt && void markRead(item).catch(() => undefined)}
                        className="font-semibold text-amber-800 hover:underline"
                      >
                        View update
                      </Link>
                      <button
                        type="button"
                        onClick={() => void markRead(item, !item.readAt).catch(() => undefined)}
                        className="text-gray-600 hover:underline"
                      >
                        {item.readAt ? 'Mark unread' : 'Mark read'}
                      </button>
                    </div>
                  </div>
                  {!item.readAt && <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
