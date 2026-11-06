// "New post" box at the top of Discover, and in "Manage club" on the club page.
// Only shown to leaders and posters.
import { ImagePlus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/Button'
import { Card } from '../../components/Card'
import type { Club } from '../../lib/session/context'
import { createPost, IMAGE_TYPES, MAX_BODY_LENGTH, MAX_IMAGES, validateImages } from './feedStore'

type Attachment = { file: File; previewUrl: string }

type PostComposerProps = {
  clubs: Club[]
  onPosted?: () => void
}

export function PostComposer({ clubs, onPosted }: PostComposerProps) {
  const [pickedClubId, setClubId] = useState(clubs[0].id)
  // Fall back to the first club if the user lost posting access to the one they picked.
  const clubId = clubs.some((c) => c.id === pickedClubId) ? pickedClubId : clubs[0].id
  const [body, setBody] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [error, setError] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  // Free the preview URLs when the composer goes away.
  const attachmentsRef = useRef(attachments)
  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])
  useEffect(() => () => attachmentsRef.current.forEach((a) => URL.revokeObjectURL(a.previewUrl)), [])

  function addFiles(list: FileList | null) {
    const files = [...attachments.map((a) => a.file), ...Array.from(list ?? [])]
    const problem = validateImages(files)
    if (problem) {
      setError(problem)
      return
    }
    setError(null)
    setAttachments(files.map((file, i) => attachments[i] ?? { file, previewUrl: URL.createObjectURL(file) }))
  }

  function removeAttachment(index: number) {
    URL.revokeObjectURL(attachments[index].previewUrl)
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  async function submit() {
    setPosting(true)
    setError(null)
    try {
      await createPost({ clubId, body, images: attachments.map((a) => a.file) })
      attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl))
      setBody('')
      setAttachments([])
      onPosted?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setPosting(false)
    }
  }

  const empty = !body.trim() && attachments.length === 0
  const remaining = MAX_BODY_LENGTH - body.length

  return (
    <Card className="mb-4">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
        <label htmlFor="post-club" className="text-gray-600">
          Posting as
        </label>
        <select
          id="post-club"
          value={clubId}
          onChange={(e) => setClubId(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-2 py-1 font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
        >
          {clubs.map((club) => (
            <option key={club.id} value={club.id}>
              {club.name}
            </option>
          ))}
        </select>
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={MAX_BODY_LENGTH}
        rows={3}
        placeholder="Share an update with the campus…"
        aria-label="Post text"
        className="w-full resize-y rounded-md border border-gray-300 p-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />

      {attachments.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-2">
          {attachments.map((a, i) => (
            <li key={a.previewUrl} className="relative">
              <img src={a.previewUrl} alt={a.file.name} className="h-20 w-20 rounded-md object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                aria-label={`Remove ${a.file.name}`}
                className="absolute -top-2 -right-2 rounded-full bg-squid p-1 text-white shadow"
              >
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept={IMAGE_TYPES.join(',')}
            multiple
            hidden
            onChange={(e) => {
              addFiles(e.target.files)
              e.target.value = '' // lets the same file be picked again after removing it
            }}
          />
          <Button
            variant="secondary"
            onClick={() => fileInput.current?.click()}
            disabled={attachments.length >= MAX_IMAGES}
          >
            <ImagePlus size={16} aria-hidden="true" />
            Photo
          </Button>
          <span className={`text-xs tabular-nums ${remaining < 100 ? 'text-red-700' : 'text-gray-500'}`}>
            {remaining}
          </span>
        </div>
        <Button onClick={submit} disabled={empty || posting}>
          {posting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </Card>
  )
}
