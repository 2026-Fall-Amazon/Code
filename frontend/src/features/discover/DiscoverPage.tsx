// Discover (side menu): a social feed of club posts and events.
// Leaders and the members they choose can post text and up to four images.
// Everyone signed in can like posts.
//
// To build:
// - Backend: Post, PostLike, and ClubRole models plus a Lambda for createPost,
//   updatePost, deletePost, toggleLike, and setPostingAccess (see feedStore.ts).
// - Uploads go to S3 under post-images/{identityId}/.
// - Replace rankFeed() with the real ranking.
// - Load the feed a page at a time instead of all at once.
import { useState } from 'react'
import { EventCard } from '../../components/EventCard'
import { PageHeader } from '../../components/PageHeader'
import { clubs, events, roleIn } from '../../mock/data'
import { canPostIn, useFeedState } from './feedStore'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'
import { buildFeed, rankFeed } from './rankFeed'

const filters = ['For you', 'My clubs'] as const

export function DiscoverPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('For you')
  const { posts, roles } = useFeedState()

  const inScope = (clubId: string) => filter === 'For you' || Boolean(roleIn(clubId))
  const feed = rankFeed(
    buildFeed(
      posts.filter((p) => inScope(p.clubId)),
      events.filter((e) => inScope(e.clubId)),
    ),
  )
  const postableClubs = clubs.filter((club) => canPostIn(roles, club.id))

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

      {feed.length === 0 ? (
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
