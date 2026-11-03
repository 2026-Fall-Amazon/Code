// Discover feed state: posts and the signed-in user's likes, shared by every
// component on the page. Each action calls the discover Lambda, which checks
// permissions; the checks here only give faster error messages.
import { remove, uploadData } from 'aws-amplify/storage'
import { useSyncExternalStore } from 'react'
import type { Schema } from '../../../../amplify/data/resource'
import { client, listAll, throwIfErrors } from '../../lib/dataClient'
import type { ClubMember, Post } from './types'

// Same limits as amplify/functions/discover/handler.py
export const MAX_BODY_LENGTH = 2000
export const MAX_IMAGES = 4
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

type FeedState = {
  posts: Post[]
  likedPostIds: ReadonlySet<string>
  loading: boolean
  error: string | null
}

let state: FeedState = { posts: [], likedPostIds: new Set(), loading: true, error: null }
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

type PostRecord = Schema['Post']['type']

const toPost = (p: PostRecord): Post => ({
  id: p.id,
  clubId: p.clubId,
  authorId: p.authorId,
  authorName: p.authorName ?? 'Club member',
  body: p.body ?? '',
  imageKeys: (p.imageKeys ?? []).filter((key): key is string => Boolean(key)),
  createdAt: p.postedAt,
  updatedAt: p.editedAt ?? undefined,
  likeCount: p.likeCount ?? 0,
})

function required<T>(result: { data?: T | null; errors?: readonly { message: string }[] }) {
  throwIfErrors(result.errors)
  if (result.data == null) throw new Error('Something went wrong. Please try again.')
  return result.data
}

const replacePost = (post: Post) => setState({ posts: state.posts.map((p) => (p.id === post.id ? post : p)) })

// Loading

export async function loadFeed(userId: string) {
  setState({ loading: true, error: null })
  try {
    const [posts, likes] = await Promise.all([
      listAll((nextToken) =>
        client.models.Post.listPostsInFeed({ feed: 'ALL' }, { sortDirection: 'DESC', nextToken }),
      ),
      listAll((nextToken) => client.models.PostLike.listPostLikeByUserId({ userId }, { nextToken })),
    ])
    setState({ posts: posts.map(toPost), likedPostIds: new Set(likes.map((like) => like.postId)), loading: false })
  } catch (e) {
    setState({ loading: false, error: e instanceof Error ? e.message : 'Could not load the feed.' })
  }
}

// Leaders only (the Lambda checks): everyone in the club and their posting role.
export async function fetchClubMembers(clubId: string): Promise<ClubMember[]> {
  const members = required(await client.queries.listClubMembers({ clubId }))
  return members.filter((m): m is ClubMember => m !== null)
}

// Actions

export function validateImages(files: File[]) {
  if (files.length > MAX_IMAGES) return `You can attach up to ${MAX_IMAGES} images.`
  if (files.some((f) => !IMAGE_TYPES.includes(f.type))) return 'Images must be JPEG, PNG, or WebP.'
  if (files.some((f) => f.size > MAX_IMAGE_BYTES)) return 'Each image must be 5 MB or smaller.'
  return null
}

// Uploads into the signed-in user's own post-images/{identityId}/ folder and returns the S3 path.
export async function uploadPostImage(data: Blob, extension: string) {
  const upload = uploadData({
    path: ({ identityId }) => `post-images/${identityId}/${crypto.randomUUID()}.${extension}`,
    data,
    options: { contentType: data.type },
  })
  return (await upload.result).path
}

export async function createPost(input: { clubId: string; body: string; images: File[] }) {
  const body = input.body.trim()
  if (!body && input.images.length === 0) throw new Error('Write something or add an image.')
  if (body.length > MAX_BODY_LENGTH) throw new Error(`Posts can be up to ${MAX_BODY_LENGTH} characters.`)
  const imageError = validateImages(input.images)
  if (imageError) throw new Error(imageError)

  const imageKeys = await Promise.all(input.images.map((file) => uploadPostImage(file, file.type.split('/')[1])))

  try {
    const post = toPost(required(await client.mutations.publishPost({ clubId: input.clubId, body, imageKeys })))
    setState({ posts: [post, ...state.posts] })
    return post
  } catch (e) {
    // Don't leave unused images behind if the post was rejected.
    await Promise.allSettled(imageKeys.map((path) => remove({ path })))
    throw e
  }
}

export async function updatePost(postId: string, body: string) {
  const trimmed = body.trim()
  if (trimmed.length > MAX_BODY_LENGTH) throw new Error(`Posts can be up to ${MAX_BODY_LENGTH} characters.`)
  replacePost(toPost(required(await client.mutations.editPost({ postId, body: trimmed }))))
}

export async function deletePost(postId: string) {
  required(await client.mutations.removePost({ postId }))
  setState({ posts: state.posts.filter((p) => p.id !== postId) })
}

export async function toggleLike(postId: string) {
  const result = required(await client.mutations.toggleLike({ postId }))
  const liked = new Set(state.likedPostIds)
  if (result.liked) liked.add(postId)
  else liked.delete(postId)
  setState({
    likedPostIds: liked,
    posts: state.posts.map((p) => (p.id === postId ? { ...p, likeCount: result.likeCount } : p)),
  })
}

// Leaders give or take away posting access. Leaders themselves are set by ADMINS.
export async function setPostingAccess(clubId: string, userId: string, canPost: boolean) {
  required(await client.mutations.setPostingAccess({ clubId, userId, canPost }))
}
