// Shapes the Discover UI works with. postApi.ts turns the real Post, Event, and
// ClubMemberInfo records from amplify/data/resource.ts into these.
import type { EventCardEvent } from '../../components/EventCard'

export type FeedPost = {
  id: string
  clubId: string
  authorId: string
  authorName: string
  body: string
  imageKeys: string[] // S3 paths under post-images/; PostImage turns them into URLs
  likeCount: number
  postedAt: string
  editedAt?: string
}

export type FeedEvent = EventCardEvent & { createdAt: string }

// One row of the feed: either a post or an event. `at` is when it was posted.
export type FeedItem =
  | { kind: 'post'; post: FeedPost; at: string }
  | { kind: 'event'; event: FeedEvent; at: string }

// Leaders are set by ADMINS. Leaders decide which members are posters.
export type PostingRole = 'leader' | 'poster'

export type ClubMember = {
  userId: string
  name: string
  role: PostingRole | null
}
