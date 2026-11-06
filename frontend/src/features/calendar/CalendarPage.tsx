// Calendar (side menu): upcoming events the user RSVP'd to, with one-tap export.
// "Can't go" cancels the RSVP right here, with an Undo in case it was a mistake.
//
// To build:
// - Google: open a prefilled Google Calendar link. Apple and Outlook: download an .ics file.
// Concept only (out of scope): two-way Google Calendar sync.
import { MapPin, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import { ConceptCard } from '../../components/Concept'
import { PageHeader } from '../../components/PageHeader'
import { addRsvp, cancelRsvp, fetchMyRsvpEvents, type ClubEvent } from '../../lib/clubData'
import { formatDayHeading, formatTime } from '../../lib/format'
import { useClubs, useCurrentUser } from '../../lib/session/hooks'
import { useLoad } from '../../lib/useLoad'

export function CalendarPage() {
  const { userId, loading: sessionLoading } = useCurrentUser()
  const { clubById } = useClubs()
  const { data: loaded = [], loading, error } = useLoad(sessionLoading ? null : userId, () => fetchMyRsvpEvents(userId))
  // Events cancelled on this page, hidden without reloading the list.
  const [cancelledIds, setCancelledIds] = useState<ReadonlySet<string>>(new Set())
  const [lastCancelled, setLastCancelled] = useState<ClubEvent | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const rsvps = loaded.filter((event) => !cancelledIds.has(event.id))

  async function run(eventId: string, action: () => Promise<void>) {
    setPendingId(eventId)
    setActionError(null)
    try {
      await action()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setPendingId(null)
    }
  }

  const cancel = (event: ClubEvent) =>
    run(event.id, async () => {
      await cancelRsvp(event.id, userId)
      setCancelledIds((ids) => new Set(ids).add(event.id))
      setLastCancelled(event)
    })

  const undo = (event: ClubEvent) =>
    run(event.id, async () => {
      await addRsvp(event.id)
      setCancelledIds((ids) => {
        const next = new Set(ids)
        next.delete(event.id)
        return next
      })
      setLastCancelled(null)
    })

  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" subtitle="Upcoming events you RSVP'd to" />

      {lastCancelled && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-squid px-4 py-3 text-sm text-white">
          <span>
            You're no longer going to <span className="font-semibold">{lastCancelled.title}</span>.
          </span>
          <button
            type="button"
            onClick={() => undo(lastCancelled)}
            disabled={pendingId !== null}
            className="font-semibold text-brand hover:underline disabled:opacity-60"
          >
            Undo
          </button>
        </div>
      )}
      {actionError && (
        <p role="alert" className="text-sm text-red-700">
          {actionError}
        </p>
      )}

      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : loading ? (
        <p className="text-gray-600">Loading your events…</p>
      ) : rsvps.length === 0 ? (
        <Card>
          <p className="text-gray-600">You haven't RSVP'd to any upcoming events. Find some on Discover.</p>
        </Card>
      ) : (
        rsvps.map((event) => (
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
                <Button variant="secondary" onClick={() => cancel(event)} disabled={pendingId !== null}>
                  <X size={16} aria-hidden="true" />
                  {pendingId === event.id ? 'Removing…' : "Can't go"}
                </Button>
                <Button variant="secondary">Google</Button>
                <Button variant="secondary">Apple</Button>
                <Button variant="secondary">Outlook</Button>
              </div>
            </div>
          </Card>
        ))
      )}

      <ConceptCard
        title="Two-way Google Calendar sync"
        description="If an officer changes an event's time or place, your Google Calendar would update automatically."
      >
        <Button disabled>Connect Google Calendar</Button>
      </ConceptCard>
    </div>
  )
}
