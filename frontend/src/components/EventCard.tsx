import { Clock, Image as ImageIcon, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { formatEventTime } from '../lib/format'
import { clubById, myRsvpEventIds } from '../mock/data'
import type { ClubEvent } from '../mock/types'
import { Button } from './Button'
import { Tag } from './Tag'

type EventCardProps = {
  event: ClubEvent
  reason?: string
}

// Title, date and time, club, one flyer image, and an RSVP button.
export function EventCard({ event, reason }: EventCardProps) {
  const club = clubById(event.clubId)
  const wasGoing = myRsvpEventIds.includes(event.id)
  // TODO: create or delete an RSVP record instead of local state.
  const [going, setGoing] = useState(wasGoing)
  const goingCount = event.rsvpCount + Number(going) - Number(wasGoing)

  return (
    <article className="flex overflow-hidden rounded-lg bg-white shadow-sm">
      <div className="flex w-24 shrink-0 items-center justify-center bg-squid-light text-gray-400 sm:w-32">
        <ImageIcon size={28} aria-label="Event flyer" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        {reason && <p className="text-xs font-semibold text-amber-700">{reason}</p>}
        <h3 className="font-bold leading-snug">{event.title}</h3>
        {club && (
          <Link to={`/clubs/${club.id}`} className="w-fit text-sm font-medium text-gray-700 hover:underline">
            {club.name}
          </Link>
        )}
        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={14} aria-hidden="true" />
          {formatEventTime(event.startsAt)}
        </p>
        {event.location && (
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin size={14} aria-hidden="true" />
            {event.location}
          </p>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </div>
          <Button variant={going ? 'secondary' : 'primary'} onClick={() => setGoing(!going)}>
            {going ? 'Going ✓' : 'RSVP'}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          {goingCount} going
          {event.capacity ? ` · ${event.capacity} spots` : ''}
        </p>
      </div>
    </article>
  )
}
