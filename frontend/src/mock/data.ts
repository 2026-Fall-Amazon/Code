// Fake data so every page has something to show. Replace these imports with
// Data API calls (generateClient<Schema>() from 'aws-amplify/data') as each feature is built.
import type {
  Announcement,
  ChatThread,
  Club,
  ClubDocument,
  ClubEvent,
  ClubRole,
  ClubVideo,
  DuesItem,
  LedgerEntry,
  Membership,
  UserProfile,
} from './types'

export const currentUser: UserProfile = {
  displayName: 'Alex Rivera',
  major: 'Finance',
  graduationYear: 2028,
  interests: ['Finance', 'Chess', 'Running', 'Service'],
}

export const clubs: Club[] = [
  {
    id: 'investment',
    name: 'Investment Club',
    category: 'Business',
    description:
      'Students who manage a small mock portfolio, pitch stocks, and host speakers from the industry.',
    meetingLocation: 'Business Building, Room 161',
    website: 'https://example.com/investment',
    memberCount: 142,
    foundedYear: 1998,
  },
  {
    id: 'chess',
    name: 'Chess Club',
    category: 'Games',
    description: 'Casual play every week and a travel team for regional tournaments. All levels welcome.',
    meetingLocation: 'Student Center, Room 204',
    memberCount: 64,
    foundedYear: 1975,
  },
  {
    id: 'running',
    name: 'Running Club',
    category: 'Sports',
    description: 'Group runs five days a week, from easy 5Ks to marathon training.',
    meetingLocation: 'Main Quad flagpole',
    memberCount: 150,
    foundedYear: 2004,
  },
  {
    id: 'service',
    name: 'Service Corps',
    category: 'Service',
    description: 'Weekend volunteer projects with local nonprofits and a spring service trip.',
    meetingLocation: 'Community Engagement Office',
    memberCount: 98,
    foundedYear: 1992,
  },
  {
    id: 'film',
    name: 'Film Society',
    category: 'Arts',
    description: 'Weekly screenings, discussions, and a student short film festival in April.',
    meetingLocation: 'Arts Center Cinema',
    memberCount: 45,
    foundedYear: 2011,
  },
  {
    id: 'robotics',
    name: 'Robotics Club',
    category: 'Engineering',
    description: 'Design, build, and compete with robots in national competitions.',
    meetingLocation: 'Engineering Hall, Lab B',
    memberCount: 73,
    foundedYear: 2009,
  },
]

export const memberships: Membership[] = [
  { clubId: 'investment', role: 'officer' },
  { clubId: 'chess', role: 'member' },
  { clubId: 'running', role: 'member' },
]

export const events: ClubEvent[] = [
  {
    id: 'e1',
    clubId: 'investment',
    title: 'Stock Pitch Workshop',
    description: 'Learn how to build a one-page pitch. Laptops recommended.',
    startsAt: '2026-11-10T19:00:00-05:00',
    endsAt: '2026-11-10T20:30:00-05:00',
    location: 'Business Building, Room 161',
    capacity: 60,
    rsvpCount: 38,
    tags: ['Finance', 'Workshop'],
  },
  {
    id: 'e2',
    clubId: 'chess',
    title: 'Blitz Night',
    startsAt: '2026-11-11T20:00:00-05:00',
    location: 'Student Center, Room 204',
    rsvpCount: 22,
    tags: ['Chess', 'Social'],
  },
  {
    id: 'e3',
    clubId: 'running',
    title: 'Saturday Long Run',
    description: '8 or 12 miles around the lakes. Pace groups for everyone.',
    startsAt: '2026-11-14T08:00:00-05:00',
    location: 'Main Quad flagpole',
    rsvpCount: 31,
    tags: ['Running', 'Fitness'],
  },
  {
    id: 'e4',
    clubId: 'service',
    title: 'Food Bank Volunteer Shift',
    startsAt: '2026-11-15T10:00:00-05:00',
    location: 'County Food Bank (vans leave from the library)',
    capacity: 20,
    rsvpCount: 17,
    tags: ['Service', 'Volunteering'],
  },
  {
    id: 'e5',
    clubId: 'investment',
    title: 'Speaker: Careers in Asset Management',
    startsAt: '2026-11-17T18:00:00-05:00',
    location: 'Business Building Auditorium',
    capacity: 150,
    rsvpCount: 96,
    tags: ['Finance', 'Careers', 'Speaker'],
  },
  {
    id: 'e6',
    clubId: 'film',
    title: 'Screening and Discussion',
    startsAt: '2026-11-18T21:00:00-05:00',
    location: 'Arts Center Cinema',
    rsvpCount: 28,
    tags: ['Film', 'Social'],
  },
  {
    id: 'e7',
    clubId: 'robotics',
    title: 'Build Night',
    startsAt: '2026-11-19T19:00:00-05:00',
    location: 'Engineering Hall, Lab B',
    rsvpCount: 19,
    tags: ['Engineering', 'Hands-on'],
  },
]

export const myRsvpEventIds = ['e1', 'e2', 'e3']

export const announcements: Announcement[] = [
  {
    id: 'a1',
    clubId: 'investment',
    title: 'Pitch competition teams are posted',
    body: 'Check the documents section for your team and mentor. First check-in is next Tuesday.',
    publishedAt: '2026-11-03T16:20:00-05:00',
  },
  {
    id: 'a2',
    clubId: 'chess',
    title: 'Room change this week',
    body: 'Blitz Night moves to Room 204 because of a scheduling conflict. Same time.',
    publishedAt: '2026-11-02T12:05:00-05:00',
  },
  {
    id: 'a3',
    clubId: 'running',
    title: 'Turkey Trot sign-ups are open',
    body: 'We have 25 discounted race entries. First come, first served. Reply in the form by Friday.',
    publishedAt: '2026-11-01T09:30:00-05:00',
  },
  {
    id: 'a4',
    clubId: 'investment',
    title: 'Dues reminder',
    body: 'Semester dues are $25 and cover speaker dinners and the pitch competition prizes.',
    publishedAt: '2026-10-29T18:00:00-05:00',
  },
  {
    id: 'a5',
    clubId: 'chess',
    title: 'Tournament team tryouts',
    body: 'Tryouts for the regional travel team are the week after break. Ratings not required.',
    publishedAt: '2026-10-27T14:45:00-05:00',
  },
]

export const ledger: LedgerEntry[] = [
  { id: 'l1', clubId: 'investment', date: '2026-09-02', description: 'Student government allocation', amount: 2000 },
  { id: 'l2', clubId: 'investment', date: '2026-09-20', description: 'Member dues (48 members)', amount: 1200 },
  { id: 'l3', clubId: 'investment', date: '2026-10-08', description: 'Speaker travel', amount: -420 },
  { id: 'l4', clubId: 'investment', date: '2026-10-22', description: 'Pitch night food', amount: -185.5 },
  { id: 'l5', clubId: 'investment', date: '2026-10-30', description: 'Printing', amount: -62.25 },
]

export const documents: ClubDocument[] = [
  { id: 'd1', clubId: 'investment', name: 'Club constitution.pdf', uploadedAt: '2026-08-28' },
  { id: 'd2', clubId: 'investment', name: 'Fall 2026 budget.xlsx', uploadedAt: '2026-09-05' },
  { id: 'd3', clubId: 'investment', name: 'Pitch competition teams.pdf', uploadedAt: '2026-11-03' },
]

// Concept preview data (out of scope for the MVP)

export const chatThreads: ChatThread[] = [
  {
    id: 'c1',
    name: 'Investment Club · Exec board',
    kind: 'group',
    lastMessage: 'Can someone book the auditorium for the 17th?',
    lastAt: '2:14 PM',
    unread: 2,
    messages: [
      { from: 'Priya', text: 'Speaker confirmed for the 17th!' },
      { from: 'Alex', text: 'Great. I will post the event tonight.', mine: true },
      { from: 'Sam', text: 'Can someone book the auditorium for the 17th?' },
    ],
  },
  {
    id: 'c2',
    name: 'Chess Club · Tournament team',
    kind: 'group',
    lastMessage: 'Practice puzzles are in the doc.',
    lastAt: 'Yesterday',
    unread: 0,
    messages: [
      { from: 'Jordan', text: 'Who is driving to regionals?' },
      { from: 'Alex', text: 'I can take three people.', mine: true },
      { from: 'Mei', text: 'Practice puzzles are in the doc.' },
    ],
  },
  {
    id: 'c3',
    name: 'Sam Patel',
    kind: 'direct',
    lastMessage: 'Thanks, see you Tuesday',
    lastAt: 'Mon',
    unread: 0,
    messages: [
      { from: 'Alex', text: 'Sent you the pitch template.', mine: true },
      { from: 'Sam', text: 'Thanks, see you Tuesday' },
    ],
  },
]

export const myDues: DuesItem[] = [
  { clubId: 'chess', amount: 15, dueDate: '2026-11-15', paid: false },
  { clubId: 'running', amount: 40, dueDate: '2026-09-30', paid: true },
]

export const sampleVideos: ClubVideo[] = [
  { id: 'v1', title: 'Fall kickoff meeting', duration: '42:10' },
  { id: 'v2', title: 'Event highlights', duration: '3:05' },
]

// Lookup helpers

export const clubById = (id: string) => clubs.find((club) => club.id === id)

export const roleIn = (clubId: string): ClubRole | undefined =>
  memberships.find((m) => m.clubId === clubId)?.role

export const myClubs = () =>
  memberships.flatMap((m) => {
    const club = clubById(m.clubId)
    return club ? [{ club, role: m.role }] : []
  })

const byStart = (a: ClubEvent, b: ClubEvent) => a.startsAt.localeCompare(b.startsAt)
const newestFirst = (a: Announcement, b: Announcement) => b.publishedAt.localeCompare(a.publishedAt)

export const eventsForClub = (clubId: string) => events.filter((e) => e.clubId === clubId).sort(byStart)

export const announcementsForClub = (clubId: string) =>
  announcements.filter((a) => a.clubId === clubId).sort(newestFirst)

export const myAnnouncements = () =>
  announcements.filter((a) => roleIn(a.clubId)).sort(newestFirst)

export const myRsvpEvents = () => events.filter((e) => myRsvpEventIds.includes(e.id)).sort(byStart)

export const ledgerForClub = (clubId: string) => ledger.filter((entry) => entry.clubId === clubId)

export const documentsForClub = (clubId: string) => documents.filter((doc) => doc.clubId === clubId)
