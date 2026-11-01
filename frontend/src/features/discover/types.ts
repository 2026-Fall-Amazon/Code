// Shapes for the Discover feed. These match the planned backend models
// (Post, PostLike, ClubRole), which are not in amplify/data/resource.ts yet.
import type { ClubEvent } from '../../mock/types'

export type Post = {
  id: string
  clubId: string
  authorId: string
  authorName: string
  body: string
  imageUrls: string[] // the real model stores S3 keys; the page turns them into signed URLs
  createdAt: string
  updatedAt?: string // set when the post is edited
  likeCount: number
}

// Leaders are set by ADMINS. Leaders decide which members are posters.
export type PostingRole = 'leader' | 'poster'

export type ClubRoleRecord = {
  clubId: string
  userId: string
  role: PostingRole
}

export type ClubMember = {
  userId: string
  name: string
}

// One row of the feed: either a post or an event.
export type FeedItem =
  | { kind: 'post'; post: Post; at: string }
  | { kind: 'event'; event: ClubEvent; at: string }
