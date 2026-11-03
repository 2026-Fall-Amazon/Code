// Home tab: the student's week at a glance, then each of their clubs with its
// next event and latest announcement. All real data except the concept cards.
// Concept only (stays mock): club chats and online dues payment.
import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { ClubCard } from '../../components/ClubCard'
import { ConceptCard } from '../../components/Concept'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import {
  fetchClubAnnouncements,
  fetchMemberCounts,
  fetchMyRsvpEvents,
  fetchUpcomingEvents,
  nextEventByClub,
} from '../../lib/clubData'
import { formatEventTime, formatMoney, formatShortDate } from '../../lib/format'
import { useClubs, useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { useLoad } from '../../lib/useLoad'
import { chatThreads, clubById as sampleClubById, myDues } from '../../mock/data'

export function HomePage() {
  const { userId, displayName, loading: sessionLoading } = useCurrentUser()
  const { clubById } = useClubs()
  const { myClubs } = useMyClubs()
  const clubs = myClubs.map(({ club }) => club)

  const { data, loading, error } = useLoad(
    sessionLoading ? null : `${userId}:${clubs.map((club) => club.id).join(',')}`,
    async () => {
      const [schedule, upcoming, memberCounts, announcements] = await Promise.all([
        fetchMyRsvpEvents(userId),
        fetchUpcomingEvents(),
        fetchMemberCounts(clubs),
        Promise.all(clubs.map(async (club) => [club.id, (await fetchClubAnnouncements(club.id))[0]] as const)),
      ])
      return {
        schedule: schedule.slice(0, 3),
        nextEvents: nextEventByClub(upcoming),
        memberCounts,
        latestAnnouncements: new Map(announcements),
      }
    },
  )

  const duesOwed = myDues.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader title={`Hi, ${displayName.split(' ')[0]}`} subtitle="Here's what your clubs have going on." />

      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardTitle
            action={
              <Link to="/calendar" className="text-sm font-medium text-amber-700 hover:underline">
                Calendar
              </Link>
            }
          >
            Your schedule
          </CardTitle>
          {loading ? (
            <p className="text-sm text-gray-600">Loading…</p>
          ) : data?.schedule.length ? (
            <ul className="space-y-3">
              {data.schedule.map((event) => (
                <li key={event.id} className="border-l-4 border-brand pl-3">
                  <p className="font-semibold leading-snug">{event.title}</p>
                  <p className="text-sm text-gray-600">
                    {formatEventTime(event.startsAt)} · {clubById(event.clubId)?.name}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-600">No upcoming RSVPs. Find events on Discover.</p>
          )}
        </Card>

        <ConceptCard title="Club chats" description="Group chats and direct messages would live here.">
          <ul className="space-y-2">
            {chatThreads.slice(0, 2).map((chat) => (
              <li key={chat.id} className="flex items-start gap-2 text-sm">
                <MessageCircle size={16} className="mt-0.5 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-semibold">{chat.name}</p>
                  <p className="truncate text-gray-600">{chat.lastMessage}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/messages" className="mt-3 inline-block text-sm font-medium text-amber-700 hover:underline">
            Open messages
          </Link>
        </ConceptCard>

        {/* Dues aren't tracked anywhere yet, so the whole card is a concept with sample numbers. */}
        <ConceptCard title="Dues" description="Students would see and pay club dues here.">
          <Stat label="Owed this semester" value={formatMoney(duesOwed)} />
          <ul className="mt-3 space-y-1.5 text-sm">
            {myDues.map((d) => (
              <li key={d.clubId} className="flex justify-between gap-2">
                <span>{sampleClubById(d.clubId)?.name}</span>
                <span className={d.paid ? 'text-green-700' : 'font-semibold'}>
                  {d.paid ? 'Paid' : `${formatMoney(d.amount)} due ${formatShortDate(d.dueDate)}`}
                </span>
              </li>
            ))}
          </ul>
          <Button disabled className="mt-4">
            Pay dues
          </Button>
        </ConceptCard>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Your clubs</h2>
        {!sessionLoading && myClubs.length === 0 ? (
          <Card>
            <p className="text-gray-600">
              You haven't joined any clubs yet.{' '}
              <Link to="/clubs" className="font-medium text-amber-700 hover:underline">
                Browse clubs
              </Link>
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {myClubs.map(({ club, role }) => (
              <ClubCard
                key={club.id}
                club={club}
                role={role}
                memberCount={data?.memberCounts.get(club.id)}
                nextEvent={data?.nextEvents.get(club.id)}
                latestAnnouncement={data?.latestAnnouncements.get(club.id)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
