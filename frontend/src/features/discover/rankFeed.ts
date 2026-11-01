// Feed ranking for Discover. Gabriel owns this.
//
// Right now it is newest first. Replace the inside of rankFeed() with the real
// ranking (interests, clubs, likes, timing, RSVPs); nothing else needs to change.
// If it later needs data the browser can't see, it can move into a Lambda.
import type { ClubEvent } from '../../mock/types'
import { eventPostedAt } from './mockFeed'
import type { FeedItem, Post } from './types'

export function buildFeed(posts: Post[], events: ClubEvent[]): FeedItem[] {
  return [
    ...posts.map((post): FeedItem => ({ kind: 'post', post, at: post.createdAt })),
    ...events.map((event): FeedItem => ({ kind: 'event', event, at: eventPostedAt[event.id] ?? event.startsAt })),
  ]
}

export function rankFeed(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
