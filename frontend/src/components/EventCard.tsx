import { Clock, Image as ImageIcon, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { client, ownedBy, throwIfErrors } from '../lib/dataClient';
import { useClubs, useCurrentUser } from '../lib/session/hooks';
import { Button } from './Button';

// Any real Event record works. Pass clubName when you already have it.
export type EventCardEvent = {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  startsAt?: string | null;
  location?: string | null;
  demoRsvpCount?: number | null;
};

type EventCardProps = {
  event: EventCardEvent;
  reason?: string;
};

export function EventCard({ event, reason }: EventCardProps) {
  const { clubById } = useClubs();
  const { userId } = useCurrentUser();
  const clubName = event.clubName ?? clubById(event.clubId)?.name;
  const [going, setGoing] = useState(false);
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [realCount, setRealCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if the current user has already RSVP'd to this event
  useEffect(() => {
    async function checkRsvp() {
      try {
        const [rsvps, counts] = await Promise.all([
          client.models.RSVP.listRSVPByEventId({ eventId: event.id }),
          client.queries.eventRsvpCounts({ eventIds: [event.id] }),
        ]);
        throwIfErrors(counts.errors);
        setRealCount(counts.data?.[0]?.count ?? 0);
        // ADMINS can read everyone's RSVPs, so look for the signed-in user's own.
        const mine = rsvps.data.find((r) => ownedBy(r.owner, userId));
        if (mine) {
          setGoing(true);
          setRsvpId(mine.id);
        }
      } catch (err) {
        console.error("Failed to fetch RSVP:", err);
      } finally {
        setLoading(false);
      }
    }
    checkRsvp();
  }, [event.id, userId]);

  // Create or delete the RSVP record in AWS
  async function toggleRsvp() {
    try {
      if (going && rsvpId) {
        await client.models.RSVP.delete({ id: rsvpId });
        setGoing(false);
        setRsvpId(null);
        setRealCount((c) => (c === null ? c : Math.max(0, c - 1)));
      } else {
        const newRsvp = await client.models.RSVP.create({ eventId: event.id });
        if (!newRsvp.data) throw new Error('Could not save the RSVP.');
        setGoing(true);
        setRsvpId(newRsvp.data.id);
        setRealCount((c) => (c === null ? c : c + 1));
      }
    } catch (err) {
      console.error("RSVP action failed:", err);
    }
  }

  return (
    <article className="flex overflow-hidden rounded-lg bg-white shadow-sm border border-gray-200">
      <div className="flex w-24 shrink-0 items-center justify-center bg-gray-100 text-gray-400 sm:w-32">
        <ImageIcon size={28} aria-label="Event flyer" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-4">
        {reason && <p className="text-xs font-semibold text-amber-700">{reason}</p>}
        <h3 className="font-bold leading-snug">{event.title}</h3>

        <Link to={`/clubs/${event.clubId}`} className="w-fit text-sm font-medium text-gray-700 hover:underline">
          {clubName}
        </Link>

        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock size={14} aria-hidden="true" />
          {event.startsAt ? new Date(event.startsAt).toLocaleString() : 'TBD'}
        </p>

        {event.location && (
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <MapPin size={14} aria-hidden="true" />
            {event.location}
          </p>
        )}

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant={going ? 'secondary' : 'primary'}
            onClick={toggleRsvp}
            disabled={loading}
          >
            {going ? 'Going ✓' : 'RSVP'}
          </Button>
          {realCount !== null && (
            <span className="text-xs text-gray-500">{realCount + (event.demoRsvpCount ?? 0)} going</span>
          )}
        </div>
      </div>
    </article>
  );
}
