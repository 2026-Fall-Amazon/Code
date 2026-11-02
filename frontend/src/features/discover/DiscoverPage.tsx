// Discover (side menu): a social feed of club posts and upcoming events.
// Leaders and the members they choose can post text and up to four images.
// Everyone signed in can like posts.
//
// "For you" shows every club's posts; "My clubs" only the clubs you're in.
// Posts load 20 at a time; events are the upcoming, non-cancelled ones.
// Order comes from rankFeed() (newest first for now).
import { useEffect, useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { EventCard } from '../../components/EventCard'
import { PageHeader } from '../../components/PageHeader'
import { useClubs, useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { fetchClubPage, fetchFeedPage, fetchLikedPostIds, fetchUpcomingEvents, type PostPage } from './postApi'
import { PostCard } from './PostCard'
import { PostComposer } from './PostComposer'
import { buildFeed, rankFeed } from './rankFeed'
import type { FeedEvent, FeedPost } from './types'

const tabs = ['For you', 'My clubs'] as const
type Tab = (typeof tabs)[number]

// Where each post source is up to: undefined = not loaded yet, null = no more pages.
type Cursor = Record<string, string | null | undefined>

type Source = { key: string; fetch: (nextToken: string | null) => Promise<PostPage> }

function sourcesFor(tab: Tab, myClubIds: string[]): Source[] {
  if (tab === 'For you') return [{ key: 'feed', fetch: fetchFeedPage }]
  return myClubIds.map((clubId) => ({ key: clubId, fetch: (token) => fetchClubPage(clubId, token) }))
}

// Loads the next page from every source that still has one.
async function loadPage(sources: Source[], cursor: Cursor) {
  const next: Cursor = { ...cursor }
  const pages = await Promise.all(
    sources
      .filter((s) => cursor[s.key] !== null)
      .map(async (s) => {
        const page = await s.fetch(cursor[s.key] ?? null)
        next[s.key] = page.nextToken
        return page.posts
      }),
  )
  return { posts: pages.flat(), cursor: next }
}

const hasMorePages = (sources: Source[], cursor: Cursor) => sources.some((s) => cursor[s.key] !== null)

export function DiscoverPage() {
  const { userId, isAdmin } = useCurrentUser()
  const { clubById, loading: clubsLoading } = useClubs()
  const { myClubs, canPostIn, isLeaderOf, isMemberOf } = useMyClubs()

  const [tab, setTab] = useState<Tab>('For you')
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [cursor, setCursor] = useState<Cursor>({})
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  const myClubIds = useMemo(() => myClubs.map((m) => m.club.id), [myClubs])
  // "For you" doesn't depend on the user's clubs, so joining a club doesn't reload it.
  const sourcesKey = tab === 'For you' ? '' : myClubIds.join(',')
  const sources = useMemo(() => sourcesFor(tab, sourcesKey ? sourcesKey.split(',') : []), [tab, sourcesKey])
  const postableClubs = myClubs.filter((m) => canPostIn(m.club.id)).map((m) => m.club)

  // First page of posts whenever the tab, the user's clubs, or "Try again" changes.
  useEffect(() => {
    let cancelled = false
    loadPage(sources, {})
      .then((page) => {
        if (cancelled) return
        setPosts(page.posts)
        setCursor(page.cursor)
        setError(null)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load the feed.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [sources, reloadCount])

  // Upcoming events (once club names are known) and the user's likes.
  useEffect(() => {
    if (clubsLoading) return
    let cancelled = false
    fetchUpcomingEvents((id) => clubById(id)?.name)
      .then((loaded) => {
        if (!cancelled) setEvents(loaded)
      })
      .catch(() => {
        // The feed still works without events.
      })
    return () => {
      cancelled = true
    }
  }, [clubsLoading, clubById, reloadCount])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchLikedPostIds(userId)
      .then((ids) => {
        if (!cancelled) setLikedIds(ids)
      })
      .catch(() => {
        // Hearts just show as not liked.
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  function switchTab(next: Tab) {
    if (next === tab) return
    setTab(next)
    setPosts([])
    setLoading(true)
    setError(null)
  }

  function retry() {
    setLoading(true)
    setError(null)
    setReloadCount((n) => n + 1)
  }

  async function loadMore() {
    setLoadingMore(true)
    try {
      const page = await loadPage(sources, cursor)
      const seen = new Set(posts.map((p) => p.id))
      setPosts([...posts, ...page.posts.filter((p) => !seen.has(p.id))])
      setCursor(page.cursor)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load more posts.')
    } finally {
      setLoadingMore(false)
    }
  }

  const hasMore = hasMorePages(sources, cursor)

  // While older posts are still unloaded, only show events newer than the oldest
  // loaded post, so "Load more" doesn't slot posts in above events already shown.
  const oldestPostAt = posts.reduce<string | null>((min, p) => (!min || p.postedAt < min ? p.postedAt : min), null)
  const visibleEvents = events.filter(
    (e) =>
      (tab === 'For you' || isMemberOf(e.clubId)) && (!hasMore || !oldestPostAt || e.createdAt >= oldestPostAt),
  )
  const feed = rankFeed(buildFeed(posts, visibleEvents))

  const canEdit = (post: FeedPost) =>
    isLeaderOf(post.clubId) || (post.authorId === userId && canPostIn(post.clubId))

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Discover" subtitle="What's happening in clubs across campus" />

      {postableClubs.length > 0 && (
        <PostComposer clubs={postableClubs} onPosted={(post) => setPosts((current) => [post, ...current])} />
      )}

      <div className="mb-4 flex gap-2" role="tablist">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => switchTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              tab === t ? 'bg-squid text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">Loading the feed…</p>
      ) : error && posts.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center shadow-sm">
          <p role="alert" className="mb-3 text-red-700">
            {error}
          </p>
          <Button variant="secondary" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : feed.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">
          {tab === 'My clubs'
            ? myClubIds.length === 0
              ? 'Join some clubs to see their posts here.'
              : 'Your clubs haven’t posted anything yet.'
            : 'Nothing here yet.'}
        </p>
      ) : (
        <div className="space-y-3">
          {feed.map((item) =>
            item.kind === 'post' ? (
              <PostCard
                key={item.post.id}
                post={item.post}
                liked={likedIds.has(item.post.id)}
                canEdit={canEdit(item.post)}
                canDelete={canEdit(item.post) || isAdmin}
                onChange={(updated) => setPosts((current) => current.map((p) => (p.id === updated.id ? updated : p)))}
                onLikeChange={(postId, liked) =>
                  setLikedIds((current) => {
                    const next = new Set(current)
                    if (liked) next.add(postId)
                    else next.delete(postId)
                    return next
                  })
                }
                onRemove={(postId) => setPosts((current) => current.filter((p) => p.id !== postId))}
              />
            ) : (
              <EventCard key={item.event.id} event={item.event} />
            ),
          )}

          {error && (
            <p role="alert" className="text-center text-sm text-red-700">
              {error}
            </p>
          )}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
