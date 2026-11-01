// Shapes for the mock data. Fields match amplify/data/resource.ts where a model exists.
// Anything marked "not in schema yet" has to be added to the schema before real data can be saved.

export type Club = {
  id: string
  name: string
  description: string
  category: string
  website?: string
  meetingLocation?: string
  memberCount: number // not in schema yet (could be counted from Membership)
  foundedYear: number // not in schema yet
}

export type ClubRole = 'member' | 'officer'

export type Membership = {
  clubId: string
  role: ClubRole // not in schema yet: needed for per-club officer permissions
}

export type ClubEvent = {
  id: string
  clubId: string
  title: string
  description?: string
  startsAt: string
  endsAt?: string
  location?: string
  capacity?: number
  rsvpCount: number // not in schema yet (could be counted from RSVP)
  tags: string[] // not in schema yet
}

export type Announcement = {
  id: string
  clubId: string
  title: string
  body: string
  publishedAt: string
}

export type UserProfile = {
  displayName: string
  major?: string
  graduationYear?: number
  interests: string[]
}

// Not in schema yet: the simple finance ledger from the MVP list.
export type LedgerEntry = {
  id: string
  clubId: string
  date: string
  description: string
  amount: number // positive = money in, negative = money out
}

// Not in schema yet: metadata for files stored in S3.
export type ClubDocument = {
  id: string
  clubId: string
  name: string
  uploadedAt: string
}

// Concept previews only (out of scope for the MVP).
export type ChatThread = {
  id: string
  name: string
  kind: 'group' | 'direct'
  lastMessage: string
  lastAt: string
  unread: number
  messages: { from: string; text: string; mine?: boolean }[]
}

export type DuesItem = {
  clubId: string
  amount: number
  dueDate: string
  paid: boolean
}

export type ClubVideo = {
  id: string
  title: string
  duration: string
}
