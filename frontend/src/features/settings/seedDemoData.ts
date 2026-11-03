// Copies the sample clubs, events, announcements, and Discover posts into the real
// tables, so the demo looks lived-in. Uses the Data API as the signed-in ADMINS user,
// so the normal rules apply. Safe to run more than once: existing records are skipped,
// except that fields added later (foundedYear, tags, demo counts) are filled in.
//
// Clubs keep their sample ids ("investment", "chess", ...) so links keep working.
// Events, announcements, and posts get a "seed-" prefix so they're easy to spot.
// Demo member/RSVP counts and like counts make seeded content look used; real
// joins, RSVPs, and likes add on top.
import { client, throwIfErrors } from '../../lib/dataClient'
import { announcements, clubs, demoPosts, events } from '../../mock/data'
import type { DemoPost } from '../../mock/types'
import { uploadPostImage } from '../discover/feedStore'

export type SeedResult = { created: number; updated: number; skipped: number }

type Result = { errors?: readonly { message: string }[] }

// Sample dates have offsets like "-05:00"; store them as UTC like AppSync does.
const toUtc = (iso: string) => new Date(iso).toISOString()

// A gradient picture with a caption, uploaded to the admin's post-images/ folder.
function placeholderImage({ label, from, to }: DemoPost['images'][number]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
  </linearGradient></defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <text x="400" y="315" font-family="system-ui, sans-serif" font-size="44" font-weight="700"
    fill="white" fill-opacity="0.85" text-anchor="middle">${label}</text>
</svg>`
  return uploadPostImage(new Blob([svg], { type: 'image/svg+xml' }), 'svg')
}

// "Priya Shah" -> "demo-priya-shah": stands in for the author's user id.
const demoAuthorId = (name: string) => `demo-${name.toLowerCase().replace(/\W+/g, '-')}`

async function upsert<T>(
  get: () => Promise<Result & { data: T | null }>,
  create: () => Promise<Result>,
  // Returns an update to run when the record exists but is missing newer fields
  fillMissing: (existing: T) => (() => Promise<Result>) | null,
  result: SeedResult,
) {
  const found = await get()
  throwIfErrors(found.errors)

  if (!found.data) {
    throwIfErrors((await create()).errors)
    result.created++
    return
  }

  const update = fillMissing(found.data)
  if (update) {
    throwIfErrors((await update()).errors)
    result.updated++
  } else {
    result.skipped++
  }
}

export async function seedDemoData(): Promise<SeedResult> {
  const result: SeedResult = { created: 0, updated: 0, skipped: 0 }

  for (const club of clubs) {
    await upsert(
      () => client.models.Club.get({ id: club.id }),
      () =>
        client.models.Club.create({
          id: club.id,
          name: club.name,
          description: club.description,
          category: club.category,
          website: club.website,
          meetingLocation: club.meetingLocation,
          foundedYear: club.foundedYear,
          demoMemberCount: club.memberCount,
        }),
      (existing) =>
        existing.foundedYear == null || existing.demoMemberCount == null
          ? () =>
              client.models.Club.update({
                id: club.id,
                foundedYear: existing.foundedYear ?? club.foundedYear,
                demoMemberCount: existing.demoMemberCount ?? club.memberCount,
              })
          : null,
      result,
    )
  }

  for (const event of events) {
    const id = `seed-${event.id}`
    await upsert(
      () => client.models.Event.get({ id }),
      () =>
        client.models.Event.create({
          id,
          clubId: event.clubId,
          title: event.title,
          description: event.description,
          startsAt: toUtc(event.startsAt),
          endsAt: event.endsAt ? toUtc(event.endsAt) : undefined,
          location: event.location,
          capacity: event.capacity,
          tags: event.tags,
          demoRsvpCount: event.rsvpCount,
        }),
      (existing) =>
        !existing.tags?.length || existing.demoRsvpCount == null
          ? () =>
              client.models.Event.update({
                id,
                tags: existing.tags?.length ? existing.tags : event.tags,
                demoRsvpCount: existing.demoRsvpCount ?? event.rsvpCount,
              })
          : null,
      result,
    )
  }

  for (const announcement of announcements) {
    const id = `seed-${announcement.id}`
    await upsert(
      () => client.models.Announcement.get({ id }),
      () =>
        client.models.Announcement.create({
          id,
          clubId: announcement.clubId,
          title: announcement.title,
          body: announcement.body,
          publishedAt: toUtc(announcement.publishedAt),
        }),
      () => null,
      result,
    )
  }

  for (const post of demoPosts) {
    const id = `seed-${post.id}`
    await upsert(
      () => client.models.Post.get({ id }),
      async () =>
        client.models.Post.create({
          id,
          clubId: post.clubId,
          authorId: demoAuthorId(post.authorName),
          authorName: post.authorName,
          body: post.body,
          imageKeys: await Promise.all(post.images.map(placeholderImage)),
          likeCount: post.likeCount,
          postedAt: toUtc(post.postedAt),
          feed: 'ALL',
        }),
      () => null,
      result,
    )
  }

  return result
}
