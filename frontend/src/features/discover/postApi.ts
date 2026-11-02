// Data calls for Discover: posts, likes, images, events, and posting access.
//
// Reads go straight to the Post / PostLike / Event models. Every write goes through
// the discover Lambda (publishPost, editPost, removePost, toggleLike, setPostingAccess),
// which checks the caller's ClubRole on the server.
import { getUrl, remove, uploadData } from 'aws-amplify/storage'
import type { Schema } from '../../../../amplify/data/resource'
import { client, listAll, throwIfErrors } from '../../lib/dataClient'
import type { ClubMember, FeedEvent, FeedPost, PostingRole } from './types'

export const MAX_BODY_LENGTH = 2000
export const MAX_IMAGES = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PAGE_SIZE = 20

type PostRecord = Schema['Post']['type']

function toFeedPost(p: PostRecord): FeedPost {
  return {
    id: p.id,
    clubId: p.clubId,
    authorId: p.authorId,
    authorName: p.authorName ?? 'Club member',
    body: p.body ?? '',
    imageKeys: (p.imageKeys ?? []).filter((key): key is string => Boolean(key)),
    likeCount: p.likeCount ?? 0,
    postedAt: p.postedAt,
    editedAt: p.editedAt ?? undefined,
  }
}

// ---------------------------------------------------------------
// Reading the feed
// ---------------------------------------------------------------

export type PostPage = { posts: FeedPost[]; nextToken: string | null }

// "For you": every club's posts, newest first.
export async function fetchFeedPage(nextToken: string | null): Promise<PostPage> {
  const { data, errors, nextToken: next } = await client.models.Post.listPostsInFeed(
    { feed: 'ALL' },
    { sortDirection: 'DESC', limit: PAGE_SIZE, nextToken },
  )
  throwIfErrors(errors)
  return { posts: data.map(toFeedPost), nextToken: next ?? null }
}

// One club's posts, newest first. "My clubs" pages through each of the user's clubs.
export async function fetchClubPage(clubId: string, nextToken: string | null): Promise<PostPage> {
  const { data, errors, nextToken: next } = await client.models.Post.listPostsByClub(
    { clubId },
    { sortDirection: 'DESC', limit: PAGE_SIZE, nextToken },
  )
  throwIfErrors(errors)
  return { posts: data.map(toFeedPost), nextToken: next ?? null }
}

// Upcoming events that haven't been cancelled.
export async function fetchUpcomingEvents(clubName: (clubId: string) => string | undefined): Promise<FeedEvent[]> {
  const now = new Date().toISOString()
  const events = await listAll((nextToken) =>
    client.models.Event.list({ filter: { startsAt: { ge: now } }, nextToken }),
  )
  return events
    .filter((e) => e.status !== 'cancelled')
    .map((e) => ({
      id: e.id,
      clubId: e.clubId,
      clubName: clubName(e.clubId),
      title: e.title,
      startsAt: e.startsAt,
      location: e.location,
      createdAt: e.createdAt,
    }))
}

// Ids of the posts the signed-in user has liked.
export async function fetchLikedPostIds(userId: string): Promise<Set<string>> {
  const likes = await listAll((nextToken) => client.models.PostLike.listPostLikeByUserId({ userId }, { nextToken }))
  return new Set(likes.map((like) => like.postId))
}

// ---------------------------------------------------------------
// Writing (through the discover Lambda)
// ---------------------------------------------------------------

export function validateImages(files: File[]) {
  if (files.length > MAX_IMAGES) return `You can attach up to ${MAX_IMAGES} images.`
  if (files.some((f) => !IMAGE_TYPES.includes(f.type))) return 'Images must be JPEG, PNG, or WebP.'
  if (files.some((f) => f.size > MAX_IMAGE_BYTES)) return 'Each image must be 5 MB or smaller.'
  return null
}

const extensionFor = (type: string) => (type.split('/')[1] ?? 'img').replace('jpeg', 'jpg').replace('svg+xml', 'svg')

// Uploads to post-images/{identityId}/, the only folder this user may write to.
export async function uploadPostImage(data: Blob): Promise<string> {
  const name = `${crypto.randomUUID()}.${extensionFor(data.type)}`
  const { path } = await uploadData({
    path: ({ identityId }) => `post-images/${identityId}/${name}`,
    data,
    options: { contentType: data.type },
  }).result
  return path
}

export async function publishPost(input: { clubId: string; body: string; images: File[] }): Promise<FeedPost> {
  const problem = validateImages(input.images)
  if (problem) throw new Error(problem)

  const imageKeys = await Promise.all(input.images.map(uploadPostImage))
  try {
    const { data, errors } = await client.mutations.publishPost({
      clubId: input.clubId,
      body: input.body.trim(),
      imageKeys,
    })
    throwIfErrors(errors)
    if (!data) throw new Error('The post was not saved. Please try again.')
    return toFeedPost(data)
  } catch (e) {
    // The post was refused, so don't leave its images behind.
    await Promise.allSettled(imageKeys.map((path) => remove({ path })))
    throw e
  }
}

export async function editPost(postId: string, body: string): Promise<FeedPost> {
  const { data, errors } = await client.mutations.editPost({ postId, body: body.trim() })
  throwIfErrors(errors)
  if (!data) throw new Error('The post was not saved. Please try again.')
  return toFeedPost(data)
}

export async function removePost(postId: string): Promise<void> {
  const { errors } = await client.mutations.removePost({ postId })
  throwIfErrors(errors)
}

export async function toggleLike(postId: string): Promise<{ liked: boolean; likeCount: number }> {
  const { data, errors } = await client.mutations.toggleLike({ postId })
  throwIfErrors(errors)
  if (!data) throw new Error('Could not update the like. Please try again.')
  return { liked: data.liked, likeCount: data.likeCount }
}

// ---------------------------------------------------------------
// Posting access (leaders only; the Lambda checks)
// ---------------------------------------------------------------

export async function listClubMembers(clubId: string): Promise<ClubMember[]> {
  const { data, errors } = await client.queries.listClubMembers({ clubId })
  throwIfErrors(errors)
  return (data ?? [])
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => ({
      userId: m.userId,
      name: m.name,
      role: m.role === 'leader' || m.role === 'poster' ? (m.role as PostingRole) : null,
    }))
}

export async function setPostingAccess(clubId: string, userId: string, canPost: boolean): Promise<void> {
  const { errors } = await client.mutations.setPostingAccess({ clubId, userId, canPost })
  throwIfErrors(errors)
}

// ---------------------------------------------------------------
// Images
// ---------------------------------------------------------------

// Signed URLs last an hour; cache them so scrolling doesn't re-request every image.
const urlCache = new Map<string, { url: string; expires: number }>()

export async function imageUrl(path: string): Promise<string> {
  const cached = urlCache.get(path)
  if (cached && cached.expires > Date.now()) return cached.url
  const { url } = await getUrl({ path, options: { expiresIn: 3600 } })
  urlCache.set(path, { url: url.toString(), expires: Date.now() + 55 * 60 * 1000 })
  return url.toString()
}
