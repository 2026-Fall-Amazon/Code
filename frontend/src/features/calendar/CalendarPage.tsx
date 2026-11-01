// Calendar (side menu): events the user RSVP'd to, with one-tap export.
//
// To build:
// - Google: open a prefilled Google Calendar link. Apple and Outlook: download an .ics file.
// Concept only (out of scope): two-way Google Calendar sync.
import { MapPin } from 'lucide-react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConceptCard } from '../../components/Concept'
import { PageHeader } from '../../components/PageHeader'
import { formatDayHeading, formatTime } from '../../lib/format'
import { clubById, myRsvpEvents } from '../../mock/data'

export function CalendarPage() {
  const rsvps = myRsvpEvents()

  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" subtitle="Events you RSVP'd to" />

      {rsvps.map((event) => (
        <Card key={event.id}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
            {formatDayHeading(event.startsAt)}
          </p>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">{event.title}</h2>
              <p className="text-sm text-gray-600">
                {formatTime(event.startsAt)} · {clubById(event.clubId)?.name}
              </p>
              {event.location && (
                <p className="flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin size={14} aria-hidden="true" />
                  {event.location}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">Google</Button>
              <Button variant="secondary">Apple</Button>
              <Button variant="secondary">Outlook</Button>
            </div>
          </div>
        </Card>
      ))}

      <ConceptCard
        title="Two-way Google Calendar sync"
        description="If an officer changes an event's time or place, your Google Calendar would update automatically."
      >
        <Button disabled>Connect Google Calendar</Button>
      </ConceptCard>
    </div>
  )
}
