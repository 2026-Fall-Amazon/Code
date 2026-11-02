import { useEffect, useState } from 'react'
import { AnnouncementCard } from '../../components/AnnouncementCard'
import type { AnnouncementCardData } from '../../components/AnnouncementCard'
import { EventCard } from '../../components/EventCard'
import type { EventCardEvent } from '../../components/EventCard'
import { PageHeader } from '../../components/PageHeader'
import { listAll, client } from '../../lib/dataClient'
import { useMyClubs } from '../../lib/session/hooks'

type InboxItem =
  | (AnnouncementCardData & { id: string; createdAt: string; type: 'announcement' })
  | (EventCardEvent & { createdAt: string; type: 'event' })

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Could not load your inbox. Please try again.'

export function InboxPage() {
  const { myClubs, loading: sessionLoading, error: sessionError } = useMyClubs()
  const [feedItems, setFeedItems] = useState<InboxItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionLoading) return

    let cancelled = false

    async function fetchInboxData() {
      setLoading(true)
      setError(null)

      try {
        const clubFeeds = await Promise.all(
          myClubs.map(async ({ club }) => {
            const [announcements, events] = await Promise.all([
              listAll((nextToken) =>
                client.models.Announcement.listAnnouncementByClubId({ clubId: club.id }, { nextToken }),
              ),
              listAll((nextToken) =>
                client.models.Event.listEventByClubIdAndStartsAt({ clubId: club.id }, { nextToken }),
              ),
            ])

            return [
              ...announcements.map((announcement) => ({
                ...announcement,
                clubName: club.name,
                type: 'announcement' as const,
              })),
              ...events.map((event) => ({
                ...event,
                clubName: club.name,
                type: 'event' as const,
              })),
            ]
          }),
        )

        const combinedFeed = clubFeeds.flat() as InboxItem[]
        combinedFeed.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))

        if (!cancelled) setFeedItems(combinedFeed)
      } catch (fetchError) {
        if (!cancelled) setError(errorMessage(fetchError))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchInboxData()
    return () => {
      cancelled = true
    }
  }, [myClubs, sessionLoading])

  const isLoading = sessionLoading || loading

  return (
    <div>
      <PageHeader title="Inbox" subtitle="Announcements and events from your clubs" />
      <div className="space-y-3" aria-live="polite">
        {isLoading ? (
          <p>Loading your inbox...</p>
        ) : sessionError ? (
          <p role="alert">{sessionError}</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : feedItems.length === 0 ? (
          <p>No new updates from your clubs.</p>
        ) : (
          feedItems.map((item) =>
            item.type === 'announcement' ? (
              <AnnouncementCard key={`announcement-${item.id}`} announcement={item} />
            ) : (
              <EventCard key={`event-${item.id}`} event={item} />
            ),
          )
        )}
      </div>
    </div>
  )
}
