// In-memory store for posts, likes, and posting roles.
//
// Every action here matches a planned Lambda mutation (createPost, updatePost,
// deletePost, toggleLike, setPostingAccess). When the backend exists, swap the
// bodies for API calls; pages only use the hooks and functions exported here.
// The permission checks below are for the demo. The Lambda must repeat them,
// because anything in the browser can be bypassed.
import { useSyncExternalStore } from 'react'
import { initialLikedPostIds, initialPosts, initialRoles, ME } from './mockFeed'
import type { ClubRoleRecord, Post, PostingRole } from './types'

export const MAX_BODY_LENGTH = 2000
export const MAX_IMAGES = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type FeedState = {
  posts: Post[]
  likedPostIds: ReadonlySet<string>
  roles: ClubRoleRecord[]
}

let state: FeedState = {
  posts: initialPosts,
  likedPostIds: new Set(initialLikedPostIds),
  roles: initialRoles,
}
const listeners = new Set<() => void>()

function setState(next: Partial<FeedState>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useFeedState() {
  return useSyncExternalStore(subscribe, () => state)
}

// Permissions

export const roleOf = (roles: ClubRoleRecord[], clubId: string, userId: string): PostingRole | undefined =>
  roles.find((r) => r.clubId === clubId && r.userId === userId)?.role

export const canPostIn = (roles: ClubRoleRecord[], clubId: string) => Boolean(roleOf(roles, clubId, ME.userId))

export const isLeaderOf = (roles: ClubRoleRecord[], clubId: string) => roleOf(roles, clubId, ME.userId) === 'leader'

// Leaders can change any post in their club. Posters can change their own.
export const canModify = (roles: ClubRoleRecord[], post: Post) =>
  isLeaderOf(roles, post.clubId) || (post.authorId === ME.userId && canPostIn(roles, post.clubId))

function requireCanModify(postId: string) {
  const post = state.posts.find((p) => p.id === postId)
  if (!post) throw new Error('That post no longer exists.')
  if (!canModify(state.roles, post)) throw new Error("You don't have permission to change this post.")
  return post
}

// Actions

export function validateImages(files: File[]) {
  if (files.length > MAX_IMAGES) return `You can attach up to ${MAX_IMAGES} images.`
  if (files.some((f) => !IMAGE_TYPES.includes(f.type))) return 'Images must be JPEG, PNG, or WebP.'
  if (files.some((f) => f.size > MAX_IMAGE_BYTES)) return 'Each image must be 5 MB or smaller.'
  return null
}

export async function createPost(input: { clubId: string; body: string; images: File[] }) {
  const body = input.body.trim()
  if (!canPostIn(state.roles, input.clubId)) throw new Error("You can't post for this club.")
  if (!body && input.images.length === 0) throw new Error('Write something or add an image.')
  if (body.length > MAX_BODY_LENGTH) throw new Error(`Posts can be up to ${MAX_BODY_LENGTH} characters.`)
  const imageError = validateImages(input.images)
  if (imageError) throw new Error(imageError)

  // Later: upload each file to S3 under post-images/{identityId}/ and send the keys.
  const post: Post = {
    id: crypto.randomUUID(),
    clubId: input.clubId,
    authorId: ME.userId,
    authorName: ME.name,
    body,
    imageUrls: input.images.map((file) => URL.createObjectURL(file)),
    createdAt: new Date().toISOString(),
    likeCount: 0,
  }
  setState({ posts: [post, ...state.posts] })
  return post
}

export async function updatePost(postId: string, body: string) {
  const post = requireCanModify(postId)
  const trimmed = body.trim()
  if (!trimmed && post.imageUrls.length === 0) throw new Error('A post needs text or an image.')
  if (trimmed.length > MAX_BODY_LENGTH) throw new Error(`Posts can be up to ${MAX_BODY_LENGTH} characters.`)

  setState({
    posts: state.posts.map((p) => (p.id === postId ? { ...p, body: trimmed, updatedAt: new Date().toISOString() } : p)),
  })
}

export async function deletePost(postId: string) {
  const post = requireCanModify(postId)
  post.imageUrls.filter((url) => url.startsWith('blob:')).forEach((url) => URL.revokeObjectURL(url))
  setState({ posts: state.posts.filter((p) => p.id !== postId) })
}

export async function toggleLike(postId: string) {
  const liked = new Set(state.likedPostIds)
  const wasLiked = liked.has(postId)
  if (wasLiked) liked.delete(postId)
  else liked.add(postId)

  setState({
    likedPostIds: liked,
    posts: state.posts.map((p) => (p.id === postId ? { ...p, likeCount: p.likeCount + (wasLiked ? -1 : 1) } : p)),
  })
}

// Leaders give or take away posting access. Leaders themselves are set by ADMINS.
export async function setPostingAccess(clubId: string, userId: string, canPost: boolean) {
  // Demo note: no leader check here, because the club page's "Viewing as" switch lets
  // anyone preview the officer view. The Lambda must check that the caller is a leader.
  if (roleOf(state.roles, clubId, userId) === 'leader') throw new Error("Leaders can't be changed here.")

  const others = state.roles.filter((r) => !(r.clubId === clubId && r.userId === userId))
  setState({ roles: canPost ? [...others, { clubId, userId, role: 'poster' }] : others })
}
