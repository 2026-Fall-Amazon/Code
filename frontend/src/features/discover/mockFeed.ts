// Fake Discover data so the feed works before the backend exists.
// Kept in this folder so the shared mock/data.ts stays untouched.
import type { ClubMember, ClubRoleRecord, Post } from './types'

// The signed-in user in the demo. Matches currentUser in mock/data.ts.
export const ME = { userId: 'u-alex', name: 'Alex Rivera' }

// Stand-in pictures until uploads go to S3.
function placeholderImage(label: string, from: string, to: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="315" font-family="system-ui, sans-serif" font-size="44" font-weight="700"
    fill="white" fill-opacity="0.85" text-anchor="middle">${label}</text>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const initialPosts: Post[] = [
  {
    id: 'p1',
    clubId: 'investment',
    authorId: 'u-priya',
    authorName: 'Priya Shah',
    body: 'Huge thanks to everyone who came out to pitch night! 40+ pitches, and the winning team takes home the trophy below. Recap slides are in the club documents.',
    imageUrls: [placeholderImage('Pitch night', '#232f3e', '#ff9900')],
    createdAt: '2026-10-31T21:15:00-05:00',
    likeCount: 48,
  },
  {
    id: 'p2',
    clubId: 'running',
    authorId: 'u-dana',
    authorName: 'Dana Okafor',
    body: 'Sunrise 10K this morning. Cold, windy, worth it.',
    imageUrls: [
      placeholderImage('Mile 1', '#f97316', '#be123c'),
      placeholderImage('Mile 4', '#0ea5e9', '#1e3a8a'),
      placeholderImage('Finish', '#22c55e', '#065f46'),
    ],
    createdAt: '2026-11-01T09:40:00-05:00',
    likeCount: 31,
  },
  {
    id: 'p3',
    clubId: 'chess',
    authorId: 'u-jordan',
    authorName: 'Jordan Lee',
    body: 'Puzzle of the week: white to move and mate in 3. First correct answer at Blitz Night gets to pick the opening for the next simul.',
    imageUrls: [placeholderImage('Mate in 3', '#44403c', '#a8a29e')],
    createdAt: '2026-10-30T17:00:00-05:00',
    likeCount: 12,
  },
  {
    id: 'p4',
    clubId: 'film',
    authorId: 'u-noor',
    authorName: 'Noor Haddad',
    body: 'Submissions for the spring short film festival open next week. Anything under 10 minutes counts. No experience needed, we lend cameras.',
    imageUrls: [],
    createdAt: '2026-10-29T12:30:00-05:00',
    likeCount: 19,
  },
  {
    id: 'p5',
    clubId: 'service',
    authorId: 'u-kai',
    authorName: 'Kai Nakamura',
    body: 'We packed 1,200 meals at the county food bank on Saturday. Here is the crew!',
    imageUrls: [
      placeholderImage('Packing line', '#16a34a', '#0f766e'),
      placeholderImage('The crew', '#eab308', '#c2410c'),
    ],
    createdAt: '2026-10-27T15:10:00-05:00',
    likeCount: 64,
  },
  {
    id: 'p6',
    clubId: 'robotics',
    authorId: 'u-sofia',
    authorName: 'Sofia Martins',
    body: 'Drivetrain v2 passed its first test. Four more weeks until regionals.',
    imageUrls: [
      placeholderImage('Drivetrain', '#475569', '#0f172a'),
      placeholderImage('CAD', '#2563eb', '#312e81'),
      placeholderImage('Test run', '#9333ea', '#4c1d95'),
      placeholderImage('Team', '#db2777', '#831843'),
    ],
    createdAt: '2026-10-26T20:05:00-05:00',
    likeCount: 27,
  },
  {
    id: 'p7',
    clubId: 'investment',
    authorId: 'u-alex',
    authorName: 'Alex Rivera',
    body: 'Reminder: portfolio rebalance vote closes Friday at 5 PM. Check the club email for the ballot.',
    imageUrls: [],
    createdAt: '2026-10-25T10:00:00-05:00',
    likeCount: 9,
  },
]

export const initialLikedPostIds = ['p2', 'p3']

// When each mock event was posted. The real Event model gets createdAt automatically.
export const eventPostedAt: Record<string, string> = {
  e1: '2026-10-28T09:00:00-05:00',
  e2: '2026-10-30T19:30:00-05:00',
  e3: '2026-11-01T07:00:00-05:00',
  e4: '2026-10-24T11:00:00-05:00',
  e5: '2026-10-31T13:00:00-05:00',
  e6: '2026-10-29T18:00:00-05:00',
  e7: '2026-10-26T16:00:00-05:00',
}

export const initialRoles: ClubRoleRecord[] = [
  { clubId: 'investment', userId: 'u-alex', role: 'leader' },
  { clubId: 'investment', userId: 'u-priya', role: 'leader' },
  { clubId: 'investment', userId: 'u-sam', role: 'poster' },
  { clubId: 'chess', userId: 'u-jordan', role: 'leader' },
  { clubId: 'chess', userId: 'u-alex', role: 'poster' },
  { clubId: 'running', userId: 'u-dana', role: 'leader' },
  { clubId: 'service', userId: 'u-kai', role: 'leader' },
  { clubId: 'film', userId: 'u-noor', role: 'leader' },
  { clubId: 'robotics', userId: 'u-sofia', role: 'leader' },
]

export const clubMembers: Record<string, ClubMember[]> = {
  investment: [
    ME,
    { userId: 'u-priya', name: 'Priya Shah' },
    { userId: 'u-sam', name: 'Sam Patel' },
    { userId: 'u-mei', name: 'Mei Chen' },
    { userId: 'u-omar', name: 'Omar Farouk' },
    { userId: 'u-grace', name: 'Grace Kim' },
  ],
  chess: [
    ME,
    { userId: 'u-jordan', name: 'Jordan Lee' },
    { userId: 'u-mei', name: 'Mei Chen' },
    { userId: 'u-luis', name: 'Luis Ortega' },
  ],
  running: [
    ME,
    { userId: 'u-dana', name: 'Dana Okafor' },
    { userId: 'u-ben', name: 'Ben Walsh' },
  ],
  service: [
    { userId: 'u-kai', name: 'Kai Nakamura' },
    { userId: 'u-ruth', name: 'Ruth Mensah' },
  ],
  film: [
    { userId: 'u-noor', name: 'Noor Haddad' },
    { userId: 'u-theo', name: 'Theo Grant' },
  ],
  robotics: [
    { userId: 'u-sofia', name: 'Sofia Martins' },
    { userId: 'u-ivan', name: 'Ivan Petrov' },
  ],
}
