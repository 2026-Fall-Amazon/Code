import { Clock, Image as ImageIcon, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';
import { clubById, events as mockEvents, myRsvpEventIds } from '../mock/data';
import { Button } from './Button';

const client = generateClient<Schema>({ authMode: 'userPool' });

// Works with real Event records (Inbox) and the mock events other pages still use.
export type EventCardEvent = {
  id: string;
  clubId: string;
  clubName?: string;
  title: string;
  startsAt?: string | null;
  location?: string | null;
};

type EventCardProps = {
  event: EventCardEvent;
  reason?: string;
};

// Mock events have ids like "e1" that don't exist in AWS. RSVPs for them stay local,
// so pages still on mock data don't write junk RSVP records.
const isMockEvent = (id: string) => mockEvents.some((e) => e.id === id);

export function EventCard({ event, reason }: EventCardProps) {
  const mock = isMockEvent(event.id);
  const clubName = event.clubName ?? clubById(event.clubId)?.name;
  const [going, setGoing] = useState(mock && myRsvpEventIds.includes(event.id));
  const [rsvpId, setRsvpId] = useState<string | null>(null);
  const [loading, setLoading] = useState(!mock);

  // Check if the current user has already RSVP'd to this event
  useEffect(() => {
    if (mock) return;
    async function checkRsvp() {
      try {
        const rsvps = await client.models.RSVP.listRSVPByEventId({ eventId: event.id });
        if (rsvps.data.length > 0) {
          setGoing(true);
          setRsvpId(rsvps.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch RSVP:", err);
      } finally {
        setLoading(false);
      }
    }
    checkRsvp();
  }, [event.id, mock]);

  // Create or delete the RSVP record in AWS
  async function toggleRsvp() {
    if (mock) {
      setGoing(!going);
      return;
    }
    try {
      if (going && rsvpId) {
        await client.models.RSVP.delete({ id: rsvpId });
        setGoing(false);
        setRsvpId(null);
      } else {
        const newRsvp = await client.models.RSVP.create({ eventId: event.id });
        if (!newRsvp.data) throw new Error('Could not save the RSVP.');
        setGoing(true);
        setRsvpId(newRsvp.data.id);
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
        </div>
      </div>
    </article>
  );
}
