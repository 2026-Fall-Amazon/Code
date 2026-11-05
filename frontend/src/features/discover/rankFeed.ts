// Feed ranking for Discover. Gabriel owns this.
//
// Posts are newest first. Upcoming events are mixed in, soonest first, one after
// every POSTS_PER_EVENT posts, so they don't bunch up at the top (seeded events are
// all created at the same moment). Leftover events go at the end.
// Replace the inside of rankFeed() with the real ranking (interests, clubs, likes,
// timing, RSVPs); nothing else needs to change. If it later needs data the browser
// can't see, it can move into a Lambda.
import type { ClubEvent } from '../../lib/clubData'
import type { FeedItem, Post } from './types'

const POSTS_PER_EVENT = 2

export function buildFeed(posts: Post[], events: ClubEvent[]): FeedItem[] {
  return [
    ...posts.map((post): FeedItem => ({ kind: 'post', post, at: post.createdAt })),
    ...events.map((event): FeedItem => ({ kind: 'event', event, at: event.startsAt })),
  ]
}

export function rankFeed(items: FeedItem[]): FeedItem[] {
  const posts = items.filter((item) => item.kind === 'post').sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  const events = items.filter((item) => item.kind === 'event').sort((a, b) => Date.parse(a.at) - Date.parse(b.at))

  const feed: FeedItem[] = []
  posts.forEach((post, i) => {
    feed.push(post)
    if ((i + 1) % POSTS_PER_EVENT === 0 && events.length) feed.push(events.shift()!)
  })
  return [...feed, ...events]
}
