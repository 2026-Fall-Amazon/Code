// Sample posts for "Load demo data" (Settings → Admin tools). The seed copies them
// into the real Post table under "seed-" ids and uploads their pictures to S3.
// Author names are made up; the authorIds don't belong to real accounts, so only
// club leaders and admins can edit or delete these posts.

export type SamplePost = {
  id: string
  clubId: string
  authorId: string
  authorName: string
  body: string
  images: string[]
  createdAt: string
  likeCount: number
}

// Placeholder pictures (SVG data URIs). The seed uploads them to S3 like real images.
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

export const samplePosts: SamplePost[] = [
  {
    id: 'p1',
    clubId: 'investment',
    authorId: 'u-priya',
    authorName: 'Priya Shah',
    body: 'Huge thanks to everyone who came out to pitch night! 40+ pitches, and the winning team takes home the trophy below. Recap slides are in the club documents.',
    images: [placeholderImage('Pitch night', '#232f3e', '#ff9900')],
    createdAt: '2026-10-31T21:15:00-05:00',
    likeCount: 48,
  },
  {
    id: 'p2',
    clubId: 'running',
    authorId: 'u-dana',
    authorName: 'Dana Okafor',
    body: 'Sunrise 10K this morning. Cold, windy, worth it.',
    images: [
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
    images: [placeholderImage('Mate in 3', '#44403c', '#a8a29e')],
    createdAt: '2026-10-30T17:00:00-05:00',
    likeCount: 12,
  },
  {
    id: 'p4',
    clubId: 'film',
    authorId: 'u-noor',
    authorName: 'Noor Haddad',
    body: 'Submissions for the spring short film festival open next week. Anything under 10 minutes counts. No experience needed, we lend cameras.',
    images: [],
    createdAt: '2026-10-29T12:30:00-05:00',
    likeCount: 19,
  },
  {
    id: 'p5',
    clubId: 'service',
    authorId: 'u-kai',
    authorName: 'Kai Nakamura',
    body: 'We packed 1,200 meals at the county food bank on Saturday. Here is the crew!',
    images: [
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
    images: [
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
    images: [],
    createdAt: '2026-10-25T10:00:00-05:00',
    likeCount: 9,
  },
]
