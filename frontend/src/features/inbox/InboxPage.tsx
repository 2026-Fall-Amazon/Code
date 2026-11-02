import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../../amplify/data/resource';
import { Plus } from 'lucide-react';
import { AnnouncementCard } from '../../components/AnnouncementCard';
import type { AnnouncementCardData } from '../../components/AnnouncementCard';
import { EventCard } from '../../components/EventCard';
import type { EventCardEvent } from '../../components/EventCard';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';

const client = generateClient<Schema>({ authMode: 'userPool' });

type InboxItem =
  | (AnnouncementCardData & { id: string; createdAt: string; type: 'announcement' })
  | (EventCardEvent & { createdAt: string; type: 'event' });

export function InboxPage() {
  const [feedItems, setFeedItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isOfficer = false;

  useEffect(() => {
    async function fetchInboxData() {
      try {
        const membershipData = await client.models.Membership.list();
        const myClubIds = membershipData.data.map(m => m.clubId);

        let combinedFeed: InboxItem[] = [];

        for (const clubId of myClubIds) {
          const club = await client.models.Club.get({ id: clubId });
          const clubName = club.data?.name || "Unknown Club";

          const announcements = await client.models.Announcement.listAnnouncementByClubId({ clubId });
          const events = await client.models.Event.listEventByClubIdAndStartsAt({ clubId });

          const namedAnnouncements = announcements.data.map(a => ({ ...a, clubName, type: 'announcement' as const }));

          const namedEvents = events.data.map(e => ({
            ...e,
            clubName,
            type: 'event' as const,
          }));

          combinedFeed = [...combinedFeed, ...namedAnnouncements, ...namedEvents];
        }

        combinedFeed.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        setFeedItems(combinedFeed);
      } catch (error) {
        console.error("Error fetching inbox data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchInboxData();
  }, []);

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Announcements and events from your clubs"
        action={
          isOfficer && (
            <Button>
              <Plus size={16} aria-hidden="true" />
              New update
            </Button>
          )
        }
      />
      <div className="space-y-3">
        {loading ? (
          <p>Loading your inbox...</p>
        ) : feedItems.length === 0 ? (
          <p>No new updates from your clubs.</p>
        ) : (
          feedItems.map((item) => (
            item.type === 'announcement' ? (
              <AnnouncementCard key={item.id} announcement={item} />
            ) : (
              <EventCard key={item.id} event={item} />
            )
          ))
        )}
      </div>
    </div>
  );
}
