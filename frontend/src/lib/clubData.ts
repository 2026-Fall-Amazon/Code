// Shared reads for clubs, events, announcements, RSVPs, and counts.
// Pages call these through useLoad().
import type { Schema } from '../../../amplify/data/resource'
import { client, listAll, ownedBy, throwIfErrors } from './dataClient'

export type ClubEvent = Schema['Event']['type']
export type Announcement = Schema['Announcement']['type']
type Club = Schema['Club']['type']

const byStart = (a: ClubEvent, b: ClubEvent) => a.startsAt.localeCompare(b.startsAt)
const postedAt = (a: Announcement) => a.publishedAt ?? a.createdAt
const isUpcoming = (event: ClubEvent, now = new Date().toISOString()) =>
  event.status !== 'cancelled' && (event.endsAt ?? event.startsAt) >= now

// Every upcoming event on campus, soonest first.
export async function fetchUpcomingEvents() {
  const now = new Date().toISOString()
  const events = await listAll((nextToken) =>
    client.models.Event.list({ filter: { startsAt: { ge: now } }, nextToken }),
  )
  return events.filter((e) => isUpcoming(e, now)).sort(byStart)
}

// One club's upcoming events, soonest first.
export async function fetchClubEvents(clubId: string) {
  const events = await listAll((nextToken) =>
    client.models.Event.listEventByClubIdAndStartsAt({ clubId }, { nextToken }),
  )
  return events.filter((e) => isUpcoming(e)).sort(byStart)
}

// One club's announcements, newest first.
export async function fetchClubAnnouncements(clubId: string) {
  const announcements = await listAll((nextToken) =>
    client.models.Announcement.listAnnouncementByClubId({ clubId }, { nextToken }),
  )
  return announcements.sort((a, b) => postedAt(b).localeCompare(postedAt(a)))
}

// Posts an announcement to a club. Announcement writes are ADMINS-only in the schema,
// so this works for admins; club leaders need a backend rule or Lambda first.
export async function postAnnouncement(input: { clubId: string; title: string; body: string }) {
  const { data, errors } = await client.models.Announcement.create({
    ...input,
    publishedAt: new Date().toISOString(),
  })
  if (errors?.some((e) => /unauthorized/i.test(e.message))) {
    throw new Error('Only admins can post announcements for now.')
  }
  throwIfErrors(errors)
  if (!data) throw new Error('Could not post the announcement.')
  return data
}

// Upcoming events the signed-in user RSVP'd to, soonest first.
export async function fetchMyRsvpEvents(userId: string) {
  const rsvps = await listAll((nextToken) => client.models.RSVP.list({ nextToken }))
  const eventIds = [...new Set(rsvps.filter((r) => ownedBy(r.owner, userId)).map((r) => r.eventId))]
  const events = await Promise.all(
    eventIds.map(async (id): Promise<ClubEvent[]> => {
      const { data, errors } = await client.models.Event.get({ id })
      throwIfErrors(errors)
      return data ? [data] : []
    }),
  )
  return events.flat().filter((e) => isUpcoming(e)).sort(byStart)
}

// Removes the signed-in user's RSVP to an event (every copy, in case of a double tap).
export async function cancelRsvp(eventId: string, userId: string) {
  const rsvps = await listAll((nextToken) => client.models.RSVP.listRSVPByEventId({ eventId }, { nextToken }))
  // ADMINS can read everyone's RSVPs, so only delete the user's own.
  for (const rsvp of rsvps.filter((r) => ownedBy(r.owner, userId))) {
    const { errors } = await client.models.RSVP.delete({ id: rsvp.id })
    throwIfErrors(errors)
  }
}

export async function addRsvp(eventId: string) {
  const { errors } = await client.models.RSVP.create({ eventId })
  throwIfErrors(errors)
}

// Members per club: real members (counted by the stats Lambda, since students can't
// read other people's memberships) plus the club's demo count.
export async function fetchMemberCounts(clubs: Pick<Club, 'id' | 'demoMemberCount'>[]) {
  const counts = new Map(clubs.map((club) => [club.id, club.demoMemberCount ?? 0]))
  const ids = clubs.map((club) => club.id)
  for (let i = 0; i < ids.length; i += 100) {
    const { data, errors } = await client.queries.clubMemberCounts({ clubIds: ids.slice(i, i + 100) })
    throwIfErrors(errors)
    for (const row of data ?? []) if (row) counts.set(row.id, (counts.get(row.id) ?? 0) + row.count)
  }
  return counts
}

// The first upcoming event for each club, from a list sorted soonest first.
export function nextEventByClub(events: ClubEvent[]) {
  const next = new Map<string, ClubEvent>()
  for (const event of events) if (!next.has(event.clubId)) next.set(event.clubId, event)
  return next
}
