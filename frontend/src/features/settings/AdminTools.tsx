// Settings panels for ADMINS: load demo data and assign club leaders and posters.
// The server enforces this too: only ADMINS can create clubs, events, announcements,
// and ClubRole records directly.
import { Copy, Database, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { client, listAll, throwIfErrors } from '../../lib/dataClient'
import { useClubs, useCurrentUser } from '../../lib/session/hooks'
import type { ClubRoleRecord } from '../../lib/session/context'
import { seedDemoData } from './seedDemoData'

const inputClass =
  'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30'

const message = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.')

// Everyone sees their own user ID, so they can send it to whoever assigns leaders.
export function UserIdCard() {
  const { userId } = useCurrentUser()
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked; the ID is still selectable on screen.
    }
  }

  return (
    <Card>
      <CardTitle>Your user ID</CardTitle>
      <p className="mb-2 text-sm text-gray-600">Send this to an admin if you need to be made a club leader.</p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-md bg-page px-3 py-2 text-xs">{userId}</code>
        <Button variant="secondary" onClick={copy} aria-label="Copy user ID">
          <Copy size={16} aria-hidden="true" />
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
    </Card>
  )
}

export function AdminTools() {
  return (
    <>
      <DemoDataCard />
      <ClubLeadersCard />
    </>
  )
}

function DemoDataCard() {
  const { refresh } = useClubs()
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  async function run() {
    setRunning(true)
    setStatus(null)
    setError(null)
    try {
      const { created, updated, skipped } = await seedDemoData()
      setStatus(`Done: ${created} created, ${updated} filled in, ${skipped} already up to date.`)
      await refresh()
    } catch (e) {
      setError(message(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Admins only</span>}>Demo data</CardTitle>
      <p className="mb-3 text-sm text-gray-600">
        Adds the demo clubs, events, announcements, and Discover posts to the real database. Safe to run again: existing
        records are kept, and only missing fields are filled in.
      </p>
      <Button onClick={run} disabled={running}>
        <Database size={16} aria-hidden="true" />
        {running ? 'Loading…' : 'Load demo data'}
      </Button>
      {status && <p className="mt-2 text-sm text-green-700">{status}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </Card>
  )
}

const fetchAllRoles = () => listAll((nextToken) => client.models.ClubRole.list({ nextToken }))

function ClubLeadersCard() {
  const { clubs, clubById, refresh } = useClubs()
  const { userId: myId } = useCurrentUser()
  const [roles, setRoles] = useState<ClubRoleRecord[]>([])
  const [clubId, setClubId] = useState('')
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'leader' | 'poster'>('leader')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const loadRoles = useCallback(async () => {
    try {
      setRoles(await fetchAllRoles())
    } catch (e) {
      setError(message(e))
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchAllRoles()
      .then((all) => {
        if (!cancelled) setRoles(all)
      })
      .catch((e) => {
        if (!cancelled) setError(message(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedClub = clubId || clubs[0]?.id || ''

  async function assign(event: FormEvent) {
    event.preventDefault()
    const id = userId.trim()
    if (!selectedClub || !id) return
    setSaving(true)
    setError(null)
    try {
      const existing = roles.find((r) => r.clubId === selectedClub && r.userId === id)
      const { errors } = existing
        ? await client.models.ClubRole.update({ clubId: selectedClub, userId: id, role })
        : await client.models.ClubRole.create({ clubId: selectedClub, userId: id, role })
      throwIfErrors(errors)
      setUserId('')
      await loadRoles()
      if (id === myId) await refresh() // your own roles changed
    } catch (e) {
      setError(message(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove(record: ClubRoleRecord) {
    setError(null)
    try {
      const { errors } = await client.models.ClubRole.delete({ clubId: record.clubId, userId: record.userId })
      throwIfErrors(errors)
      await loadRoles()
      if (record.userId === myId) await refresh()
    } catch (e) {
      setError(message(e))
    }
  }

  const sorted = [...roles].sort(
    (a, b) =>
      (clubById(a.clubId)?.name ?? a.clubId).localeCompare(clubById(b.clubId)?.name ?? b.clubId) ||
      (a.role ?? '').localeCompare(b.role ?? ''),
  )

  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Admins only</span>}>Club leaders</CardTitle>
      {clubs.length === 0 ? (
        <p className="text-sm text-gray-600">No clubs yet. Load the demo data first.</p>
      ) : (
        <form onSubmit={assign} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto_auto]">
          <select
            aria-label="Club"
            value={selectedClub}
            onChange={(e) => setClubId(e.target.value)}
            className={inputClass}
          >
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
          <input
            aria-label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID (from their Settings page)"
            className={inputClass}
          />
          <select
            aria-label="Role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'leader' | 'poster')}
            className={inputClass}
          >
            <option value="leader">Leader</option>
            <option value="poster">Poster</option>
          </select>
          <Button type="submit" disabled={saving || !userId.trim()}>
            {saving ? 'Saving…' : 'Assign'}
          </Button>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {sorted.length > 0 && (
        <ul className="mt-4 divide-y divide-gray-100 text-sm">
          {sorted.map((r) => (
            <li key={`${r.clubId}:${r.userId}`} className="flex items-center gap-3 py-2">
              <span className="w-32 shrink-0 truncate font-medium">{clubById(r.clubId)?.name ?? r.clubId}</span>
              <span className="min-w-0 flex-1 truncate text-gray-600">
                {r.userId === myId ? 'You' : <code className="text-xs">{r.userId}</code>}
              </span>
              <span className="shrink-0 capitalize text-gray-700">{r.role}</span>
              <button
                type="button"
                onClick={() => remove(r)}
                aria-label={`Remove ${r.role} from ${clubById(r.clubId)?.name ?? r.clubId}`}
                className="rounded-full p-1.5 text-gray-500 hover:bg-page hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
