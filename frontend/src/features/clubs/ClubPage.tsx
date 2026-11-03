// Club page: description, member count, founding year, events, and a Join button.
// Officers also get posting tools, the finance ledger, and documents.
//
// Real data: the club, member count, upcoming events, announcements, Join/Leave, and the
// user's role. The "Viewing as" switch is a demo-only override of that role.
//
// To build:
// - Post event / Post announcement: Event and Announcement writes are ADMINS-only in the
//   schema, so leaders need a new rule or a Lambda first.
// - The ledger and documents need new models (and S3 uploads); they show sample data until then.
// Concept only (out of scope): video and online dues payment.
import { FileText, Megaphone, Play, Plus, Upload } from 'lucide-react'
import { useState } from 'react'
import { useClubs, useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { Link, useParams } from 'react-router'
import { AnnouncementCard } from '../../components/AnnouncementCard'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { ConceptBadge, ConceptCard } from '../../components/Concept'
import { EventCard } from '../../components/EventCard'
import { Stat } from '../../components/Stat'
import { ManagePosters } from '../discover/ManagePosters'
import { fetchClubAnnouncements, fetchClubEvents, fetchMemberCounts } from '../../lib/clubData'
import { formatMoney, formatShortDate } from '../../lib/format'
import type { Club } from '../../lib/session/context'
import { useLoad } from '../../lib/useLoad'
import { documentsForClub, ledgerForClub, sampleVideos } from '../../mock/data'

type ViewAs = 'visitor' | 'member' | 'officer'

export function ClubPage() {
  const { clubId = '' } = useParams()
  const { clubById, loading } = useClubs()
  const club = clubById(clubId)

  if (loading) return <p className="text-gray-600">Loading club…</p>

  if (!club) {
    return (
      <Card>
        <p className="mb-2">We couldn't find that club.</p>
        <Link to="/clubs" className="font-medium text-amber-700 hover:underline">
          Browse clubs
        </Link>
      </Card>
    )
  }
  // The key resets the page's state when you move between clubs.
  return <ClubDetails key={club.id} club={club} />
}

function ClubDetails({ club }: { club: Club }) {
  const { roleIn, hasMembership, isLeaderOf, join, leave } = useMyClubs()
  const { isAdmin } = useCurrentUser()
  const realRole = roleIn(club.id)
  const realView: ViewAs = realRole === 'leader' || realRole === 'poster' ? 'officer' : realRole ? 'member' : 'visitor'
  // The demo switch overrides the real role until the user joins or leaves.
  const [override, setOverride] = useState<ViewAs | null>(null)
  const viewAs = override ?? realView
  const [busy, setBusy] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const { data, error: loadError, reload } = useLoad(club.id, async () => {
    const [events, announcements, counts] = await Promise.all([
      fetchClubEvents(club.id),
      fetchClubAnnouncements(club.id),
      fetchMemberCounts([club]),
    ])
    return { events, announcements, memberCount: counts.get(club.id) }
  })

  async function changeMembership(action: (clubId: string) => Promise<void>) {
    setBusy(true)
    setJoinError(null)
    try {
      await action(club.id)
      setOverride(null)
      reload() // refresh the member count
    } catch (e) {
      setJoinError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const isMember = viewAs !== 'visitor'
  const isOfficer = viewAs === 'officer'
  const clubEvents = data?.events ?? []
  const clubAnnouncements = data?.announcements ?? []

  return (
    <div className="space-y-4">
      <DemoRoleSwitch value={viewAs} onChange={setOverride} />

      <Card className="overflow-hidden p-0">
        <div className="h-20 bg-squid-light" />
        <div className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{club.name}</h1>
              {club.category && <p className="text-sm text-gray-600">{club.category}</p>}
            </div>
            {hasMembership(club.id) ? (
              <Button variant="secondary" disabled={busy} onClick={() => changeMembership(leave)}>
                Leave club
              </Button>
            ) : (
              <Button disabled={busy} onClick={() => changeMembership(join)}>
                Join club
              </Button>
            )}
          </div>
          {(joinError ?? loadError) && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {joinError ?? loadError}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-8">
            <Stat label="Members" value={data?.memberCount === undefined ? '…' : String(data.memberCount)} size="sm" />
            {club.foundedYear && <Stat label="Founded" value={String(club.foundedYear)} size="sm" />}
            <Stat label="Upcoming events" value={data ? String(clubEvents.length) : '…'} size="sm" />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          <Card>
            <CardTitle>About</CardTitle>
            <p className="text-sm">{club.description || 'No description yet.'}</p>
            {club.meetingLocation && (
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-medium">Meets at:</span> {club.meetingLocation}
              </p>
            )}
          </Card>

          <section>
            <h2 className="mb-3 text-lg font-bold">Upcoming events</h2>
            <div className="space-y-3">
              {clubEvents.length ? (
                clubEvents.map((event) => <EventCard key={event.id} event={{ ...event, clubName: club.name }} />)
              ) : (
                <p className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">No events scheduled.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold">Announcements</h2>
            {isMember ? (
              clubAnnouncements.length ? (
                <div className="space-y-3">
                  {clubAnnouncements.map((a) => (
                    <AnnouncementCard key={a.id} announcement={{ ...a, clubName: club.name }} />
                  ))}
                </div>
              ) : (
                <p className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">No announcements yet.</p>
              )
            ) : (
              <p className="rounded-lg bg-white p-4 text-sm text-gray-600 shadow-sm">
                Join this club to see its announcements.
              </p>
            )}
          </section>

          <ConceptCard title="Videos" description="Meeting recordings and event highlights would appear here.">
            <div className="grid grid-cols-2 gap-3">
              {sampleVideos.map((video) => (
                <div key={video.id}>
                  <div className="relative flex aspect-video items-center justify-center rounded-md bg-squid-light">
                    <Play size={28} className="text-white/70" aria-hidden="true" />
                    <span className="absolute right-1.5 bottom-1.5 rounded bg-black/60 px-1.5 text-xs text-white">
                      {video.duration}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium">{video.title}</p>
                </div>
              ))}
            </div>
          </ConceptCard>
        </div>

        <div className="space-y-4">
          {isOfficer && <OfficerTools />}
          {/* Uses real member data, so it follows the real role, not the demo switch. */}
          {(isLeaderOf(club.id) || isAdmin) && <ManagePosters clubId={club.id} />}
          {isOfficer && <Finances clubId={club.id} />}
          {isOfficer && <Documents clubId={club.id} />}
          {viewAs === 'member' && (
            <ConceptCard title="Dues" description="Members would pay club dues here.">
              <Stat label="Due Nov 15" value={formatMoney(25)} />
              <Button disabled className="mt-3 w-full">
                Pay dues
              </Button>
            </ConceptCard>
          )}
        </div>
      </div>
    </div>
  )
}

function DemoRoleSwitch({ value, onChange }: { value: ViewAs; onChange: (v: ViewAs) => void }) {
  const options: ViewAs[] = ['visitor', 'member', 'officer']
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-gray-600">Demo, viewing as:</span>
      <div className="inline-flex overflow-hidden rounded-md border border-gray-300 bg-white">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`px-3 py-1 capitalize ${value === option ? 'bg-squid font-semibold text-white' : 'hover:bg-page'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

function OfficerTools() {
  return (
    <Card>
      <CardTitle>Officer tools</CardTitle>
      <div className="grid gap-2">
        <Button>
          <Plus size={16} aria-hidden="true" />
          Post event
        </Button>
        <Button variant="secondary">
          <Megaphone size={16} aria-hidden="true" />
          Post announcement
        </Button>
      </div>
    </Card>
  )
}

function Finances({ clubId }: { clubId: string }) {
  const entries = ledgerForClub(clubId)
  const income = entries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0)
  const expenses = entries.filter((e) => e.amount < 0).reduce((sum, e) => sum - e.amount, 0)

  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Officers only · sample data</span>}>Finances</CardTitle>
      <Stat label="Balance" value={formatMoney(income - expenses)} />
      <div className="mt-3 grid grid-cols-2 gap-3 border-y border-gray-100 py-3">
        <Stat label="Money in" value={formatMoney(income)} tone="positive" size="sm" />
        <Stat label="Money out" value={formatMoney(expenses)} tone="negative" size="sm" />
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} className="flex justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate">{entry.description}</span>
              <span className="text-xs text-gray-500">{formatShortDate(entry.date)}</span>
            </span>
            <span className={`shrink-0 font-semibold tabular-nums ${entry.amount < 0 ? 'text-red-700' : 'text-green-700'}`}>
              {entry.amount < 0 ? '−' : '+'}
              {formatMoney(Math.abs(entry.amount))}
            </span>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-4 w-full">
        <Plus size={16} aria-hidden="true" />
        Add entry
      </Button>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-md border border-dashed border-brand-soft p-2 text-sm">
        <span>Collect dues online</span>
        <ConceptBadge />
      </div>
    </Card>
  )
}

function Documents({ clubId }: { clubId: string }) {
  return (
    <Card>
      <CardTitle action={<span className="text-xs text-gray-500">Sample data</span>}>Documents</CardTitle>
      <ul className="space-y-2 text-sm">
        {documentsForClub(clubId).map((doc) => (
          <li key={doc.id} className="flex items-center gap-2">
            <FileText size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
            <span className="flex-1 truncate">{doc.name}</span>
            <span className="shrink-0 text-xs text-gray-500">{formatShortDate(doc.uploadedAt)}</span>
          </li>
        ))}
      </ul>
      <Button variant="secondary" className="mt-4 w-full">
        <Upload size={16} aria-hidden="true" />
        Upload document
      </Button>
    </Card>
  )
}
