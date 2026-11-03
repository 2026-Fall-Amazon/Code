import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatEventTime } from '../lib/format'
import type { Announcement, ClubEvent } from '../lib/clubData'
import type { Club, MyRole } from '../lib/session/context'
import { RoleBadge } from './Tag'

type ClubCardProps = {
  club: Club
  role?: MyRole
  memberCount?: number
  nextEvent?: ClubEvent
  latestAnnouncement?: Announcement
}

// Name, category, member count, and next event. Home also passes the latest announcement.
// The page loads the data and passes it in, so a list of cards needs one request, not one per card.
export function ClubCard({ club, role, memberCount, nextEvent, latestAnnouncement }: ClubCardProps) {
  const details = [club.category, memberCount === undefined ? null : `${memberCount} members`].filter(Boolean)

  return (
    <Link
      to={`/clubs/${club.id}`}
      className="group flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold group-hover:underline">{club.name}</h3>
          {details.length > 0 && <p className="text-sm text-gray-600">{details.join(' · ')}</p>}
        </div>
        {role ? <RoleBadge role={role} /> : <ChevronRight size={18} className="text-gray-400" aria-hidden="true" />}
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-500">Next event: </span>
        {nextEvent ? `${nextEvent.title}, ${formatEventTime(nextEvent.startsAt)}` : 'None scheduled'}
      </div>
      {latestAnnouncement && (
        <div className="text-sm">
          <span className="font-medium text-gray-500">Latest: </span>
          {latestAnnouncement.title}
        </div>
      )}
    </Link>
  )
}
