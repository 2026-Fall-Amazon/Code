// Feed ordering for Discover. Gabriel owns this.
//
// For now it's newest first: posts by when they were posted, events by when they
// were created. Change the inside of rankFeed() to rank differently; nothing else
// needs to change.
import type { FeedEvent, FeedItem, FeedPost } from './types'

export function buildFeed(posts: FeedPost[], events: FeedEvent[]): FeedItem[] {
  return [
    ...posts.map((post): FeedItem => ({ kind: 'post', post, at: post.postedAt })),
    ...events.map((event): FeedItem => ({ kind: 'event', event, at: event.createdAt })),
  ]
}

export function rankFeed(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
