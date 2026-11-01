import { Link } from 'react-router'
import { formatShortDate } from '../lib/format'
import { clubById } from '../mock/data'
import type { Announcement } from '../mock/types'

// Club name, message preview, and time posted.
export function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const club = clubById(announcement.clubId)

  return (
    <article className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        {club && (
          <Link to={`/clubs/${club.id}`} className="font-semibold text-gray-700 hover:underline">
            {club.name}
          </Link>
        )}
        <time dateTime={announcement.publishedAt} className="shrink-0 text-gray-500">
          {formatShortDate(announcement.publishedAt)}
        </time>
      </div>
      <h3 className="font-bold">{announcement.title}</h3>
      <p className="line-clamp-2 text-sm text-gray-600">{announcement.body}</p>
    </article>
  )
}
