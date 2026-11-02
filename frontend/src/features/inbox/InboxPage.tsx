import React, { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { Plus } from 'lucide-react';
import { AnnouncementCard } from '../../components/AnnouncementCard';
import { EventCard } from '../../components/EventCard';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';

const client = generateClient();

export function InboxPage() {
  const [feedItems, setFeedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isOfficer = false;

  useEffect(() => {
    async function fetchInboxData() {
      try {
        const membershipData = await client.models.Membership.list();
        const myClubIds = membershipData.data.map(m => m.clubId);

        let combinedFeed = [];

        for (const clubId of myClubIds) {
          const club = await client.models.Club.get({ id: clubId });
          const clubName = club.data?.name || "Unknown Club";

          const announcements = await client.models.Announcement.listAnnouncementByClubId({ clubId });
          const events = await client.models.Event.listEventByClubIdAndStartsAt({ clubId });
          
          const namedAnnouncements = announcements.data.map(a => ({ ...a, clubName, type: 'announcement' }));
          
          // Map AWS Event to match EventCard props (adding tags and rsvpCount)
          const namedEvents = events.data.map(e => ({ 
            ...e, 
            clubName, 
            type: 'event',
            tags: [],
            rsvpCount: 0 
          }));

          combinedFeed = [...combinedFeed, ...namedAnnouncements, ...namedEvents];
        }

        combinedFeed.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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