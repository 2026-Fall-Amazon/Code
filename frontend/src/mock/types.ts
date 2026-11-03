// Shapes for the sample content in mock/data.ts. Real pages use the generated types
// (Schema['Club']['type'], etc.) through lib/session and lib/clubData.

export type Club = {
  id: string
  name: string
  description: string
  category: string
  website?: string
  meetingLocation?: string
  memberCount: number // seeded as Club.demoMemberCount
  foundedYear: number // real: Club.foundedYear
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
  rsvpCount: number // seeded as Event.demoRsvpCount
  tags: string[] // real: Event.tags
}

export type Announcement = {
  id: string
  clubId: string
  title: string
  body: string
  publishedAt: string
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

// Seeded as Post records by Settings → Admin tools.
export type DemoPost = {
  id: string
  clubId: string
  authorName: string
  body: string
  images: { label: string; from: string; to: string }[] // generated placeholder pictures
  postedAt: string
  likeCount: number
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
