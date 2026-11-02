// Copies the mock clubs, events, and announcements into the real tables, so the demo
// has data. Uses the Data API as the signed-in ADMINS user, so the normal rules apply.
// Safe to run more than once: anything that already exists is skipped.
//
// Clubs keep their mock ids ("investment", "chess", ...) so existing links keep working.
// Events and announcements get a "seed-" prefix, because EventCard treats the bare mock
// ids ("e1") as local-only demo events.
import { client, throwIfErrors } from '../../lib/dataClient'
import { announcements, clubs, events } from '../../mock/data'

export type SeedResult = { created: number; skipped: number }

// Mock dates have offsets like "-05:00"; store them as UTC like AppSync does.
const toUtc = (iso: string) => new Date(iso).toISOString()

async function createIfMissing(
  exists: () => Promise<{ data: unknown; errors?: readonly { message: string }[] }>,
  create: () => Promise<{ errors?: readonly { message: string }[] }>,
  result: SeedResult,
) {
  const found = await exists()
  throwIfErrors(found.errors)
  if (found.data) {
    result.skipped++
    return
  }
  const { errors } = await create()
  throwIfErrors(errors)
  result.created++
}

export async function seedDemoData(): Promise<SeedResult> {
  const result: SeedResult = { created: 0, skipped: 0 }

  for (const club of clubs) {
    await createIfMissing(
      () => client.models.Club.get({ id: club.id }),
      () =>
        client.models.Club.create({
          id: club.id,
          name: club.name,
          description: club.description,
          category: club.category,
          website: club.website,
          meetingLocation: club.meetingLocation,
        }),
      result,
    )
  }

  for (const event of events) {
    const id = `seed-${event.id}`
    await createIfMissing(
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
        }),
      result,
    )
  }

  for (const announcement of announcements) {
    const id = `seed-${announcement.id}`
    await createIfMissing(
      () => client.models.Announcement.get({ id }),
      () =>
        client.models.Announcement.create({
          id,
          clubId: announcement.clubId,
          title: announcement.title,
          body: announcement.body,
          publishedAt: toUtc(announcement.publishedAt),
        }),
      result,
    )
  }

  return result
}
