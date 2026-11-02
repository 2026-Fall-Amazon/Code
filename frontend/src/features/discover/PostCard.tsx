// A club post: club and author, text, up to four images, and a like button.
// Leaders of the club and the post's author also get Edit and Delete
// (the discover Lambda checks the same rules on the server).
import { Heart, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { useClubs } from '../../lib/session/hooks'
import { editPost, MAX_BODY_LENGTH, removePost, toggleLike } from './postApi'
import { PostImage } from './PostImage'
import { timeAgo } from './timeAgo'
import type { FeedPost } from './types'

type PostCardProps = {
  post: FeedPost
  liked: boolean
  canEdit: boolean
  canDelete: boolean
  onChange: (post: FeedPost) => void
  onLikeChange: (postId: string, liked: boolean) => void
  onRemove: (postId: string) => void
}

export function PostCard({ post, liked, canEdit, canDelete, onChange, onLikeChange, onRemove }: PostCardProps) {
  const { clubById } = useClubs()
  const club = clubById(post.clubId)
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      setMode('view')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  function like() {
    run(async () => {
      const result = await toggleLike(post.id)
      onLikeChange(post.id, result.liked)
      onChange({ ...post, likeCount: result.likeCount })
    })
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
            {post.authorName} · <time dateTime={post.postedAt}>{timeAgo(post.postedAt)}</time>
            {post.editedAt && <span title={`Edited ${timeAgo(post.editedAt)}`}> · edited</span>}
          </p>
        </div>
        {(canEdit || canDelete) && mode === 'view' && (
          <PostMenu
            onEdit={canEdit ? () => setMode('edit') : undefined}
            onDelete={canDelete ? () => setMode('confirm-delete') : undefined}
          />
        )}
      </header>

      {mode === 'edit' ? (
        <EditForm
          initialBody={post.body}
          saving={busy}
          onCancel={() => {
            setError(null)
            setMode('view')
          }}
          onSave={(body) => run(async () => onChange(await editPost(post.id, body)))}
        />
      ) : (
        post.body && <p className="px-4 pb-3 whitespace-pre-wrap break-words">{post.body}</p>
      )}

      {post.imageKeys.length > 0 && <ImageGrid paths={post.imageKeys} />}

      {mode === 'confirm-delete' && (
        <div className="mx-4 mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-red-50 p-3 text-sm">
          <span className="font-medium text-red-800">Delete this post? This can't be undone.</span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setMode('view')} disabled={busy}>
              Cancel
            </Button>
            <Button
              className="bg-red-700 text-white hover:bg-red-800"
              disabled={busy}
              onClick={() =>
                run(async () => {
                  await removePost(post.id)
                  onRemove(post.id)
                })
              }
            >
              {busy ? 'Deleting…' : 'Delete'}
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
          onClick={like}
          disabled={busy}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium hover:bg-page disabled:opacity-60 ${
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

function PostMenu({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
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
          {onEdit && (
            <button type="button" role="menuitem" className={item} onClick={onEdit}>
              <Pencil size={16} aria-hidden="true" />
              Edit
            </button>
          )}
          {onDelete && (
            <button type="button" role="menuitem" className={`${item} text-red-700`} onClick={onDelete}>
              <Trash2 size={16} aria-hidden="true" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function EditForm({
  initialBody,
  saving,
  onCancel,
  onSave,
}: {
  initialBody: string
  saving: boolean
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
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(body)} disabled={saving || body.trim() === initialBody.trim()}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}

// 1 image fills the width, 2 sit side by side, 3 is one tall plus two stacked, 4 is a 2×2 grid.
function ImageGrid({ paths }: { paths: string[] }) {
  const shown = paths.slice(0, 4)
  return (
    <div className={`grid gap-0.5 overflow-hidden ${shown.length === 1 ? '' : 'aspect-[16/10] grid-cols-2 grid-rows-2'}`}>
      {shown.map((path, i) => (
        <PostImage
          key={path}
          path={path}
          alt={`Image ${i + 1} of ${shown.length}`}
          className={`h-full w-full ${shown.length === 1 ? 'aspect-[4/3] max-h-[28rem]' : ''} ${
            (shown.length === 3 && i === 0) || shown.length === 2 ? 'row-span-2' : ''
          }`}
        />
      ))}
    </div>
  )
}
