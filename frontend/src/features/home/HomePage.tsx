// Home tab: the student's week at a glance, then each of their clubs with its
// next event and latest announcement.
//
// To build:
// - Load the signed-in user's memberships, RSVPs, and announcements from the Data API
//   instead of mock/data.
// Concept only (stays mock): club chats and online dues payment.
import { MessageCircle } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { ClubCard } from '../../components/ClubCard'
import { ConceptBadge, ConceptCard } from '../../components/Concept'
import { PageHeader } from '../../components/PageHeader'
import { Stat } from '../../components/Stat'
import { formatEventTime, formatMoney, formatShortDate } from '../../lib/format'
import { chatThreads, clubById, currentUser, myClubs, myDues, myRsvpEvents } from '../../mock/data'

export function HomePage() {
  const schedule = myRsvpEvents().slice(0, 3)
  const duesOwed = myDues.filter((d) => !d.paid).reduce((sum, d) => sum + d.amount, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${currentUser.displayName.split(' ')[0]}`}
        subtitle="Here's what your clubs have going on."
      />

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
          <ul className="space-y-3">
            {schedule.map((event) => (
              <li key={event.id} className="border-l-4 border-brand pl-3">
                <p className="font-semibold leading-snug">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {formatEventTime(event.startsAt)} · {clubById(event.clubId)?.name}
                </p>
              </li>
            ))}
          </ul>
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

        <Card>
          <CardTitle>Dues</CardTitle>
          <Stat label="Owed this semester" value={formatMoney(duesOwed)} />
          <ul className="mt-3 space-y-1.5 text-sm">
            {myDues.map((d) => (
              <li key={d.clubId} className="flex justify-between gap-2">
                <span>{clubById(d.clubId)?.name}</span>
                <span className={d.paid ? 'text-green-700' : 'font-semibold'}>
                  {d.paid ? 'Paid' : `${formatMoney(d.amount)} due ${formatShortDate(d.dueDate)}`}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2">
            <Button disabled>Pay dues</Button>
            <ConceptBadge />
          </div>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Your clubs</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {myClubs().map(({ club, role }) => (
            <ClubCard key={club.id} club={club} role={role} showLatestAnnouncement />
          ))}
        </div>
      </section>
    </div>
  )
}
