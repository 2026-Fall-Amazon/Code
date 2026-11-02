import { createContext } from 'react'
import type { Schema } from '../../../../amplify/data/resource'
import type { SavedProfile } from '../../features/profile/api'

export type Club = Schema['Club']['type']
export type Membership = Schema['Membership']['type']
export type ClubRoleRecord = Schema['ClubRole']['type']

// leader and poster come from ClubRole; member means a Membership with no role.
export type MyRole = 'leader' | 'poster' | 'member'

export type MyClub = {
  club: Club
  role: MyRole
}

export type Session = {
  // Signed-in user (Cognito)
  userId: string // Cognito sub. ClubRole.userId and Post.authorId use this.
  email: string
  isAdmin: boolean // in the ADMINS group
  profile: SavedProfile | null // null until the user sets up their profile

  // Data loaded once for the whole app
  clubs: Club[]
  memberships: Membership[] // only the signed-in user's
  roles: ClubRoleRecord[] // only the signed-in user's

  loading: boolean
  error: string | null

  refresh: () => Promise<void>
  refreshProfile: () => Promise<void>
  join: (clubId: string) => Promise<void>
  leave: (clubId: string) => Promise<void>
}

export const SessionContext = createContext<Session | null>(null)
