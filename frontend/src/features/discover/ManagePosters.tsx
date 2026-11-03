// Club page panel where leaders choose which members can post to Discover.
// Leaders themselves are assigned by ADMINS, so they can't be switched off here.
// Members come from the listClubMembers Lambda, because Membership and UserProfile
// are only readable by their owners.
import { useState } from 'react'
import { Card, CardTitle } from '../../components/Card'
import { useLoad } from '../../lib/useLoad'
import { fetchClubMembers, setPostingAccess } from './feedStore'

export function ManagePosters({ clubId }: { clubId: string }) {
  const { data: members = [], loading, error: loadError, reload } = useLoad(clubId, () => fetchClubMembers(clubId))
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function toggle(userId: string, canPost: boolean) {
    setError(null)
    setSavingId(userId)
    try {
      await setPostingAccess(clubId, userId, canPost)
      reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Leaders only</span>}>Who can post</CardTitle>
      <p className="mb-2 text-sm text-gray-600">Members turned on here can post to Discover for this club.</p>
      {loading && members.length === 0 ? (
        <p className="text-sm text-gray-600">Loading members…</p>
      ) : members.length === 0 ? (
        <p className="text-sm text-gray-600">No members yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {members.map((member) => (
            <li key={member.userId} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span className="truncate">{member.name}</span>
              {member.role === 'leader' ? (
                <span className="rounded-full bg-squid px-2 py-0.5 text-xs font-semibold text-brand">Leader</span>
              ) : (
                <button
                  type="button"
                  role="switch"
                  aria-checked={member.role === 'poster'}
                  aria-label={`${member.name} can post`}
                  disabled={savingId !== null}
                  onClick={() => toggle(member.userId, member.role !== 'poster')}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
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
      {(error ?? loadError) && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {error ?? loadError}
        </p>
      )}
    </Card>
  )
}
