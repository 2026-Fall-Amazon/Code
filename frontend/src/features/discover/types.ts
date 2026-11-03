// Shapes the Discover pages use. Posts come from the Post model; the store
// converts each record (see toPost in feedStore.ts).
import type { ClubEvent } from '../../lib/clubData'

export type Post = {
  id: string
  clubId: string
  authorId: string
  authorName: string
  body: string
  imageKeys: string[] // S3 paths under post-images/; PostCard turns them into signed URLs
  createdAt: string // Post.postedAt
  updatedAt?: string // Post.editedAt, set when the post is edited
  likeCount: number
}

// A club member as returned by the listClubMembers query.
export type ClubMember = {
  userId: string
  name: string
  role?: string | null // "leader", "poster", or empty for regular members
}

// One row of the feed: either a post or an event.
export type FeedItem =
  | { kind: 'post'; post: Post; at: string }
  | { kind: 'event'; event: ClubEvent; at: string }
