import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatEventTime } from '../lib/format'
import { announcementsForClub, eventsForClub } from '../mock/data'
import type { Club, ClubRole } from '../mock/types'
import { RoleBadge } from './Tag'

type ClubCardProps = {
  club: Club
  role?: ClubRole
  showLatestAnnouncement?: boolean
}

// Name, category, member count, and next event. Home also shows the latest announcement.
export function ClubCard({ club, role, showLatestAnnouncement = false }: ClubCardProps) {
  const nextEvent = eventsForClub(club.id)[0]
  const latest = showLatestAnnouncement ? announcementsForClub(club.id)[0] : undefined

  return (
    <Link
      to={`/clubs/${club.id}`}
      className="group flex flex-col gap-2 rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold group-hover:underline">{club.name}</h3>
          <p className="text-sm text-gray-600">
            {club.category} · {club.memberCount} members
          </p>
        </div>
        {role ? <RoleBadge role={role} /> : <ChevronRight size={18} className="text-gray-400" aria-hidden="true" />}
      </div>
      <div className="text-sm">
        <span className="font-medium text-gray-500">Next event: </span>
        {nextEvent ? `${nextEvent.title}, ${formatEventTime(nextEvent.startsAt)}` : 'None scheduled'}
      </div>
      {latest && (
        <div className="text-sm">
          <span className="font-medium text-gray-500">Latest: </span>
          {latest.title}
        </div>
      )}
    </Link>
  )
}
