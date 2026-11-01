// Club page panel where leaders choose which members can post to Discover.
// Leaders themselves are assigned by ADMINS, so they can't be switched off here.
//
// To build:
// - Members come from a listClubMembers Lambda, because Membership and UserProfile
//   are only readable by their owners.
import { useState } from 'react'
import { Card, CardTitle } from '../../components/Card'
import { roleOf, setPostingAccess, useFeedState } from './feedStore'
import { clubMembers } from './mockFeed'

export function ManagePosters({ clubId }: { clubId: string }) {
  const { roles } = useFeedState()
  const [error, setError] = useState<string | null>(null)
  const members = clubMembers[clubId] ?? []

  async function toggle(userId: string, canPost: boolean) {
    setError(null)
    try {
      await setPostingAccess(clubId, userId, canPost)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    }
  }

  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Leaders only</span>}>Who can post</CardTitle>
      <p className="mb-2 text-sm text-gray-600">Members turned on here can post to Discover for this club.</p>
      {members.length === 0 ? (
        <p className="text-sm text-gray-600">No members yet.</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {members.map((member) => {
            const role = roleOf(roles, clubId, member.userId)
            return (
              <li key={member.userId} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate">{member.name}</span>
                {role === 'leader' ? (
                  <span className="rounded-full bg-squid px-2 py-0.5 text-xs font-semibold text-brand">Leader</span>
                ) : (
                  <button
                    type="button"
                    role="switch"
                    aria-checked={role === 'poster'}
                    aria-label={`${member.name} can post`}
                    onClick={() => toggle(member.userId, role !== 'poster')}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                      role === 'poster' ? 'bg-brand' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                        role === 'poster' ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                )}
              </li>
            )
          })}
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
