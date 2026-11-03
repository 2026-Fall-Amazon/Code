// Discover (side menu): a social feed of club posts and events.
// Leaders and the members they choose can post text and up to four images.
// Everyone signed in can like posts.
//
// Real data: posts, likes, and posting roles (discover Lambda), plus upcoming events.
// Images upload to S3 under post-images/{identityId}/. Demo posts are loaded from
// Settings → Admin tools.
//
// To build:
// - Replace rankFeed() with the real ranking.
// - Load the feed a page at a time instead of all at once.
import { useEffect, useState } from 'react'
import { EventCard } from '../../components/EventCard'
import { PageHeader } from '../../components/PageHeader'
import { fetchUpcomingEvents } from '../../lib/clubData'
import { useClubs, useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { useLoad } from '../../lib/useLoad'
import { loadFeed, useFeedState } from './feedStore'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'
import { buildFeed, rankFeed } from './rankFeed'

const filters = ['For you', 'My clubs'] as const

export function DiscoverPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('For you')
  const { userId, loading: sessionLoading } = useCurrentUser()
  const { clubs } = useClubs()
  const { isMemberOf, canPostIn } = useMyClubs()
  const { posts, loading: feedLoading, error: feedError } = useFeedState()
  const { data: events = [], loading: eventsLoading } = useLoad(sessionLoading ? null : 'upcoming', fetchUpcomingEvents)

  useEffect(() => {
    if (!sessionLoading) void loadFeed(userId)
  }, [sessionLoading, userId])

  const inScope = (clubId: string) => filter === 'For you' || isMemberOf(clubId)
  const feed = rankFeed(
    buildFeed(
      posts.filter((p) => inScope(p.clubId)),
      events.filter((e) => inScope(e.clubId)),
    ),
  )
  const postableClubs = clubs.filter((club) => canPostIn(club.id))

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Discover" subtitle="What's happening in clubs across campus" />

      {postableClubs.length > 0 && <PostComposer clubs={postableClubs} />}

      <div className="mb-4 flex gap-2" role="tablist">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f ? 'bg-squid text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {feedError ? (
        <p role="alert" className="rounded-lg bg-white p-6 text-center text-red-700 shadow-sm">
          {feedError}
        </p>
      ) : (feedLoading || eventsLoading) && feed.length === 0 ? (
        <p className="p-6 text-center text-gray-600">Loading the feed…</p>
      ) : feed.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">
          {filter === 'My clubs' ? 'Your clubs haven’t posted anything yet.' : 'Nothing here yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {feed.map((item) =>
            item.kind === 'post' ? (
              <PostCard key={item.post.id} post={item.post} />
            ) : (
              <EventCard key={item.event.id} event={item.event} />
            ),
          )}
        </div>
      )}
    </div>
  )
}
