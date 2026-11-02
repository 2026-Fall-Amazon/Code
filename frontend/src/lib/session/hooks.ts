// Shared hooks for "who am I", "which clubs exist", and "which clubs am I in".
// See lib/session/README.md for how to switch a page from mock/data to these.
import { useCallback, useContext, useMemo } from 'react'
import { SessionContext, type MyClub, type MyRole, type Session } from './context'

function useSession(): Session {
  const session = useContext(SessionContext)
  if (!session) throw new Error('useSession must be used inside <SessionProvider>.')
  return session
}

// The signed-in user. displayName falls back to the email until they set up a profile.
export function useCurrentUser() {
  const { userId, email, isAdmin, profile, loading, error, refreshProfile } = useSession()
  const displayName = profile?.displayName ?? email.split('@')[0]
  return { userId, email, isAdmin, profile, displayName, loading, error, refreshProfile }
}

// Every club, plus a lookup by id.
export function useClubs() {
  const { clubs, loading, error, refresh } = useSession()
  const byId = useMemo(() => new Map(clubs.map((club) => [club.id, club])), [clubs])
  const clubById = useCallback((id: string) => byId.get(id), [byId])
  return { clubs, clubById, loading, error, refresh }
}

// Clubs the signed-in user belongs to, with their role in each.
// A ClubRole (leader/poster) counts even without a Membership record.
export function useMyClubs() {
  const { clubs, memberships, roles, loading, error, join, leave } = useSession()

  const roleByClub = useMemo(() => {
    const map = new Map<string, MyRole>()
    for (const m of memberships) map.set(m.clubId, 'member')
    for (const r of roles) if (r.role) map.set(r.clubId, r.role)
    return map
  }, [memberships, roles])

  const myClubs = useMemo<MyClub[]>(
    () =>
      clubs
        .filter((club) => roleByClub.has(club.id))
        .map((club) => ({ club, role: roleByClub.get(club.id)! }))
        .sort((a, b) => a.club.name.localeCompare(b.club.name)),
    [clubs, roleByClub],
  )

  const roleIn = useCallback((clubId: string) => roleByClub.get(clubId), [roleByClub])
  const isMemberOf = useCallback((clubId: string) => roleByClub.has(clubId), [roleByClub])
  // True only with a real Membership record (what Join/Leave create and delete).
  const hasMembership = useCallback((clubId: string) => memberships.some((m) => m.clubId === clubId), [memberships])
  const isLeaderOf = useCallback((clubId: string) => roleByClub.get(clubId) === 'leader', [roleByClub])
  const canPostIn = useCallback(
    (clubId: string) => ['leader', 'poster'].includes(roleByClub.get(clubId) ?? ''),
    [roleByClub],
  )

  return { myClubs, roleIn, isMemberOf, hasMembership, isLeaderOf, canPostIn, join, leave, loading, error }
}
