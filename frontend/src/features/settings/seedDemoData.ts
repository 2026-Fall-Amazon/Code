// Copies the mock clubs, events, and announcements into the real tables, so the demo
// has data. Uses the Data API as the signed-in ADMINS user, so the normal rules apply.
// Safe to run more than once: existing records are skipped, except that missing
// fields added later (Club.foundedYear, Event.tags) are filled in.
//
// Clubs keep their mock ids ("investment", "chess", ...) so existing links keep working.
// Events and announcements get a "seed-" prefix, because EventCard treats the bare mock
// ids ("e1") as local-only demo events.
import { client, throwIfErrors } from '../../lib/dataClient'
import { announcements, clubs, events } from '../../mock/data'

export type SeedResult = { created: number; updated: number; skipped: number }

type Result = { errors?: readonly { message: string }[] }

// Mock dates have offsets like "-05:00"; store them as UTC like AppSync does.
const toUtc = (iso: string) => new Date(iso).toISOString()

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
        }),
      (existing) =>
        existing.foundedYear == null
          ? () => client.models.Club.update({ id: club.id, foundedYear: club.foundedYear })
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
        }),
      (existing) =>
        !existing.tags?.length ? () => client.models.Event.update({ id, tags: event.tags }) : null,
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

  return result
}
