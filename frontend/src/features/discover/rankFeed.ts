// Feed ranking for Discover. Gabriel owns this.
//
// Right now it is newest first. Replace the inside of rankFeed() with the real
// ranking (interests, clubs, likes, timing, RSVPs); nothing else needs to change.
// If it later needs data the browser can't see, it can move into a Lambda.
import type { ClubEvent } from '../../lib/clubData'
import type { FeedItem, Post } from './types'

export function buildFeed(posts: Post[], events: ClubEvent[]): FeedItem[] {
  return [
    ...posts.map((post): FeedItem => ({ kind: 'post', post, at: post.createdAt })),
    // Events appear in the feed from when they were posted.
    ...events.map((event): FeedItem => ({ kind: 'event', event, at: event.createdAt })),
  ]
}

export function rankFeed(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}
