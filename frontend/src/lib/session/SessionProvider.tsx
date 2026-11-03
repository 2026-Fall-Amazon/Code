// Loads who's signed in, their profile, all clubs, and the user's memberships and
// club roles once, and shares them with every page through the hooks in hooks.ts.
// Rendered inside <Authenticator>, so it only mounts after sign-in and resets on sign-out.
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { getMyProfile } from '../../features/profile/api'
import type { SavedProfile } from '../../features/profile/api'
import { client, listAll, ownedBy, throwIfErrors } from '../dataClient'
import { SessionContext, type Club, type ClubRoleRecord, type Membership, type Session } from './context'

type SessionData = {
  userId: string
  email: string
  isAdmin: boolean
  profile: SavedProfile | null
  clubs: Club[]
  memberships: Membership[]
  roles: ClubRoleRecord[]
}

const emptyData: SessionData = {
  userId: '',
  email: '',
  isAdmin: false,
  profile: null,
  clubs: [],
  memberships: [],
  roles: [],
}

async function fetchMyMemberships(userId: string) {
  const all = await listAll((nextToken) => client.models.Membership.list({ nextToken }))
  // ADMINS can read everyone's memberships, so keep only the user's own.
  return all.filter((m) => ownedBy(m.owner, userId))
}

async function fetchSessionData(): Promise<SessionData> {
  const [user, authSession] = await Promise.all([getCurrentUser(), fetchAuthSession()])
  const userId = user.userId
  const groups = authSession.tokens?.accessToken.payload['cognito:groups']

  const [profile, clubs, roles, memberships] = await Promise.all([
    getMyProfile(),
    listAll((nextToken) => client.models.Club.list({ nextToken })),
    listAll((nextToken) => client.models.ClubRole.listClubRoleByUserId({ userId }, { nextToken })),
    fetchMyMemberships(userId),
  ])

  return {
    userId,
    email: user.signInDetails?.loginId ?? user.username,
    isAdmin: Array.isArray(groups) && groups.includes('ADMINS'),
    profile,
    clubs,
    memberships,
    roles,
  }
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Could not load your account.')

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SessionData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchSessionData()
      .then((loaded) => {
        if (!cancelled) setData(loaded)
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await fetchSessionData())
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const profile = await getMyProfile()
    setData((d) => ({ ...d, profile }))
  }, [])

  const reloadMemberships = useCallback(async () => {
    const memberships = await fetchMyMemberships(data.userId)
    setData((d) => ({ ...d, memberships }))
  }, [data.userId])

  const join = useCallback(
    async (clubId: string) => {
      // Skip if already joined, so double-clicks don't create duplicates.
      if (data.memberships.some((m) => m.clubId === clubId)) return
      const { errors } = await client.models.Membership.create({ clubId })
      throwIfErrors(errors)
      await reloadMemberships()
    },
    [data.memberships, reloadMemberships],
  )

  const leave = useCallback(
    async (clubId: string) => {
      // Delete every match, in case an older duplicate exists.
      for (const m of data.memberships.filter((m) => m.clubId === clubId)) {
        const { errors } = await client.models.Membership.delete({ id: m.id })
        throwIfErrors(errors)
      }
      await reloadMemberships()
    },
    [data.memberships, reloadMemberships],
  )

  const value = useMemo<Session>(
    () => ({ ...data, loading, error, refresh, refreshProfile, join, leave }),
    [data, loading, error, refresh, refreshProfile, join, leave],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
