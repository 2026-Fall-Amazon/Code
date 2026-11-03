// A club post: club and author, text, up to four images, and a like button.
// Leaders and the post's author also get Edit and Delete.
import { getUrl } from 'aws-amplify/storage'
import { Heart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { useClubs, useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { useLoad } from '../../lib/useLoad'
import { deletePost, MAX_BODY_LENGTH, toggleLike, updatePost, useFeedState } from './feedStore'
import { timeAgo } from './timeAgo'
import type { Post } from './types'

export function PostCard({ post }: { post: Post }) {
  const { likedPostIds } = useFeedState()
  const { clubById } = useClubs()
  const { userId } = useCurrentUser()
  const { isLeaderOf, canPostIn } = useMyClubs()
  const club = clubById(post.clubId)
  const liked = likedPostIds.has(post.id)
  // Leaders can change any post in their club. Posters can change their own.
  // The Lambda checks this again; this only decides whether to show the menu.
  const canModify = isLeaderOf(post.clubId) || (post.authorId === userId && canPostIn(post.clubId))
  const imageUrls = useImageUrls(post.imageKeys)
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const [error, setError] = useState<string | null>(null)

  async function run(action: () => Promise<void>) {
    setError(null)
    try {
      await action()
      setMode('view')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  return (
    <article className="rounded-lg bg-white shadow-sm">
      <header className="flex items-start gap-3 p-4 pb-2">
        <ClubAvatar name={club?.name ?? '?'} />
        <div className="min-w-0 flex-1">
          {club ? (
            <Link to={`/clubs/${club.id}`} className="font-bold hover:underline">
              {club.name}
            </Link>
          ) : (
            <span className="font-bold">Unknown club</span>
          )}
          <p className="text-sm text-gray-600">
            {post.authorName} · <time dateTime={post.createdAt}>{timeAgo(post.createdAt)}</time>
            {post.updatedAt && <span title={`Edited ${timeAgo(post.updatedAt)}`}> · edited</span>}
          </p>
        </div>
        {canModify && mode === 'view' && (
          <PostMenu onEdit={() => setMode('edit')} onDelete={() => setMode('confirm-delete')} />
        )}
      </header>

      {mode === 'edit' ? (
        <EditForm
          initialBody={post.body}
          onCancel={() => {
            setError(null)
            setMode('view')
          }}
          onSave={(body) => run(() => updatePost(post.id, body))}
        />
      ) : (
        post.body && <p className="px-4 pb-3 whitespace-pre-wrap break-words">{post.body}</p>
      )}

      {imageUrls.length > 0 && <ImageGrid urls={imageUrls} />}

      {mode === 'confirm-delete' && (
        <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 p-3 text-sm">
          <span className="font-medium text-red-800">Delete this post? This can't be undone.</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode('view')}>
              Cancel
            </Button>
            <Button className="bg-red-700 text-white hover:bg-red-800" onClick={() => run(() => deletePost(post.id))}>
              Delete
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mx-4 mt-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <footer className="px-2 py-1.5">
        <button
          type="button"
          aria-pressed={liked}
          aria-label={liked ? 'Unlike' : 'Like'}
          onClick={() => run(() => toggleLike(post.id))}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-page ${
            liked ? 'text-red-600' : 'text-gray-600'
          }`}
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          <span className="tabular-nums">{post.likeCount}</span>
        </button>
      </footer>
    </article>
  )
}

// Turns the post's S3 paths into short-lived signed URLs the browser can load.
function useImageUrls(keys: string[]) {
  const { data } = useLoad(keys.length ? keys.join('|') : null, () =>
    Promise.all(keys.map(async (path) => (await getUrl({ path })).url.toString())),
  )
  return data ?? []
}

function ClubAvatar({ name }: { name: string }) {
  return (
    <div
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-squid-light font-bold text-brand"
    >
      {name.charAt(0)}
    </div>
  )
}

function PostMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  const item = 'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-page'

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Post options"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="rounded-full p-1.5 text-gray-500 hover:bg-page"
      >
        <MoreHorizontal size={20} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-10 mt-1 w-36 overflow-hidden rounded-md bg-white shadow-lg ring-1 ring-black/5">
          <button type="button" role="menuitem" className={item} onClick={onEdit}>
            <Pencil size={16} aria-hidden="true" />
            Edit
          </button>
          <button type="button" role="menuitem" className={`${item} text-red-700`} onClick={onDelete}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}

function EditForm({
  initialBody,
  onCancel,
  onSave,
}: {
  initialBody: string
  onCancel: () => void
  onSave: (body: string) => void
}) {
  const [body, setBody] = useState(initialBody)

  return (
    <div className="px-4 pb-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_BODY_LENGTH}
        rows={4}
        aria-label="Edit post"
        autoFocus
        className="w-full resize-y rounded-md border border-gray-300 p-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={() => onSave(body)} disabled={body.trim() === initialBody.trim()}>
          Save
        </Button>
      </div>
    </div>
  )
}

// 1 image fills the width, 2 sit side by side, 3 is one tall plus two stacked, 4 is a 2×2 grid.
function ImageGrid({ urls }: { urls: string[] }) {
  const shown = urls.slice(0, 4)
  return (
    <div className={`grid gap-0.5 overflow-hidden ${shown.length === 1 ? '' : 'aspect-[16/10] grid-cols-2 grid-rows-2'}`}>
      {shown.map((url, i) => (
        <img
          key={url}
          src={url}
          alt={`Image ${i + 1} of ${shown.length}`}
          loading="lazy"
          className={`h-full w-full bg-page object-cover ${shown.length === 1 ? 'max-h-[28rem]' : ''} ${
            shown.length === 3 && i === 0 ? 'row-span-2' : ''
          } ${shown.length === 2 ? 'row-span-2' : ''}`}
        />
      ))}
    </div>
  )
}
