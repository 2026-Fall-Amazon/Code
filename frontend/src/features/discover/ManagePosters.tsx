// Club page panel where leaders choose which members can post to Discover.
// Only rendered for the club's real leaders; the discover Lambda checks again.
// Leaders themselves are assigned by ADMINS (Settings → Admin tools), so they
// can't be switched off here.
import { useEffect, useState } from 'react'
import { Card, CardTitle } from '../../components/Card'
import { useCurrentUser } from '../../lib/session/hooks'
import { listClubMembers, setPostingAccess } from './postApi'
import type { ClubMember } from './types'

export function ManagePosters({ clubId }: { clubId: string }) {
  const { userId } = useCurrentUser()
  const [members, setMembers] = useState<ClubMember[] | null>(null)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listClubMembers(clubId)
      .then((loaded) => {
        if (!cancelled) setMembers(loaded)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load members.')
      })
    return () => {
      cancelled = true
    }
  }, [clubId])

  async function toggle(member: ClubMember) {
    const canPost = member.role !== 'poster'
    setPending(member.userId)
    setError(null)
    try {
      await setPostingAccess(clubId, member.userId, canPost)
      setMembers((current) =>
        (current ?? []).map((m) => (m.userId === member.userId ? { ...m, role: canPost ? 'poster' : null } : m)),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setPending(null)
    }
  }

  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Leaders only</span>}>Who can post</CardTitle>
      <p className="mb-2 text-sm text-gray-600">Members turned on here can post to Discover for this club.</p>
      {members === null && !error ? (
        <p className="text-sm text-gray-600">Loading members…</p>
      ) : members?.length === 0 ? (
        <p className="text-sm text-gray-600">No members yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {(members ?? []).map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="truncate">
                {member.name}
                {member.userId === userId && <span className="text-gray-500"> (you)</span>}
              </span>
              {member.role === 'leader' ? (
                <span className="rounded-full bg-squid px-2 py-0.5 text-xs font-semibold text-brand">Leader</span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={member.role === 'poster'}
                  aria-label={`${member.name} can post`}
                  disabled={pending !== null}
                  onClick={() => toggle(member)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${
                    member.role === 'poster' ? 'bg-brand' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      member.role === 'poster' ? 'translate-x-5' : ''
                    }`}
                  />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </Card>
  )
}
