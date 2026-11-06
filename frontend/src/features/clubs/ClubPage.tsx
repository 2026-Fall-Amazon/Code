// Club page: description, member count, founding year, events, and a Join button.
// Officers also get posting tools, the finance ledger, and documents.
//
// Real data: the club, member count, upcoming events, announcements, Join/Leave, and the
// user's role. The "Viewing as" switch is a demo-only override of that role.
//
// To build:
// - Post event, and Post announcement for leaders who aren't admins: Event and Announcement
//   writes are ADMINS-only in the schema, so leaders need a new rule or a Lambda first.
// - The ledger needs a new model; it shows sample data until then.
// Concept only (out of scope): video, online dues payment, documents, and teams within a club.
import { ChevronDown, FileText, ImagePlus, Megaphone, Play, Plus, Settings, Upload, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useClubs, useCurrentUser, useMyClubs } from '../../lib/session/hooks'
import { Link, useParams } from 'react-router'
import { AnnouncementCard } from '../../components/AnnouncementCard'
import { Button } from '../../components/Button'
import { Card, CardTitle } from '../../components/Card'
import { ConceptBadge, ConceptCard } from '../../components/Concept'
import { EventCard } from '../../components/EventCard'
import { Stat } from '../../components/Stat'
import { ManagePosters } from '../discover/ManagePosters'
import { PostComposer } from '../discover/PostComposer'
import { fetchClubAnnouncements, fetchClubEvents, fetchMemberCounts, postAnnouncement } from '../../lib/clubData'
import { formatMoney, formatShortDate } from '../../lib/format'
import type { Club } from '../../lib/session/context'
import { useLoad } from '../../lib/useLoad'
import { documentsForClub, ledgerForClub, sampleVideos, teamsForClub } from '../../mock/data'

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
  const { roleIn, hasMembership, isLeaderOf, canPostIn, join, leave } = useMyClubs()
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
  const teams = teamsForClub(club.id)

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

          {teams.length > 0 && <Teams teams={teams} />}

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
          {/* "Who can post" uses real member data, so it also needs the real role. */}
          {isOfficer && (
            <ManageClub
              club={club}
              canPost={canPostIn(club.id)}
              canManagePosters={isLeaderOf(club.id) || isAdmin}
              onAnnounced={reload}
            />
          )}
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

// Officer tools and "Who can post", folded away until an officer opens them.
// Announcements are short notices for members; Discover posts go to the whole campus
// and can have photos.
type ManageClubProps = { club: Club; canPost: boolean; canManagePosters: boolean; onAnnounced: () => void }

function ManageClub({ club, canPost, canManagePosters, onAnnounced }: ManageClubProps) {
  const [writing, setWriting] = useState<'announcement' | 'post' | null>(null)
  const [posted, setPosted] = useState(false)

  function open(form: 'announcement' | 'post') {
    setWriting(form)
    setPosted(false)
  }

  return (
    <details className="group rounded-lg bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-bold [&::-webkit-details-marker]:hidden">
        <Settings size={18} className="text-gray-500" aria-hidden="true" />
        <span className="flex-1">Manage club</span>
        <ChevronDown size={18} className="text-gray-500 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="space-y-4 border-t border-gray-100 p-4">
        <div className="grid gap-2">
          <Button>
            <Plus size={16} aria-hidden="true" />
            Post event
          </Button>
          {writing !== 'announcement' && (
            <Button variant="secondary" onClick={() => open('announcement')}>
              <Megaphone size={16} aria-hidden="true" />
              Post announcement
            </Button>
          )}
          {canPost && writing !== 'post' && (
            <Button variant="secondary" onClick={() => open('post')}>
              <ImagePlus size={16} aria-hidden="true" />
              Post to Discover
            </Button>
          )}
        </div>
        {posted && (
          <p role="status" className="text-sm text-green-700">
            Posted to Discover.{' '}
            <Link to="/discover" className="font-semibold underline">
              See it in the feed
            </Link>
          </p>
        )}
        {writing === 'announcement' && (
          <AnnouncementForm
            clubId={club.id}
            onClose={() => setWriting(null)}
            onPosted={() => {
              setWriting(null)
              onAnnounced()
            }}
          />
        )}
        {writing === 'post' && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">New Discover post</p>
              <button type="button" onClick={() => setWriting(null)} className="text-sm text-gray-600 hover:underline">
                Cancel
              </button>
            </div>
            <PostComposer
              clubs={[club]}
              onPosted={() => {
                setWriting(null)
                setPosted(true)
              }}
            />
          </div>
        )}
        {canManagePosters && <ManagePosters clubId={club.id} />}
      </div>
    </details>
  )
}

// Members see the announcement on the club page right away, and the notifications
// job alerts them within a few minutes (in the app, and by email if they opted in).
type AnnouncementFormProps = { clubId: string; onClose: () => void; onPosted: () => void }

function AnnouncementForm({ clubId, onClose, onPosted }: AnnouncementFormProps) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPosting(true)
    setError(null)
    try {
      await postAnnouncement({ clubId, title: title.trim(), body: body.trim() })
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setPosting(false)
    }
  }

  const field =
    'w-full rounded-md border border-gray-300 p-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30'

  return (
    <form onSubmit={submit} className="space-y-2 rounded-md border border-gray-200 p-3">
      <p className="font-semibold">New announcement</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        aria-label="Announcement title"
        maxLength={120}
        required
        autoFocus
        className={field}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="What do members need to know?"
        aria-label="Announcement message"
        maxLength={2000}
        rows={4}
        required
        className={`${field} resize-y`}
      />
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={posting}>
          Cancel
        </Button>
        <Button type="submit" disabled={posting || !title.trim() || !body.trim()}>
          {posting ? 'Posting…' : 'Post'}
        </Button>
      </div>
    </form>
  )
}

// Sample teams inside a club (e.g. SIBC's Amazon project team). Display only.
function Teams({ teams }: { teams: ReturnType<typeof teamsForClub> }) {
  return (
    <ConceptCard title="Teams" description="Smaller groups inside this club, each with its own lead, members, and updates.">
      <ul className="grid gap-3 sm:grid-cols-2">
        {teams.map((team) => (
          <li key={team.id} className="flex flex-col rounded-md border border-gray-200 p-3">
            <p className="font-semibold">{team.name}</p>
            <p className="mt-1 flex-1 text-sm text-gray-600">{team.description}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <Users size={14} aria-hidden="true" />
              {team.memberCount} members · Lead: {team.lead}
            </p>
            <Button variant="secondary" disabled className="mt-3 w-full">
              Request to join
            </Button>
          </li>
        ))}
      </ul>
    </ConceptCard>
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
    <ConceptCard
      title="Documents"
      description="Officers would keep the club's files here, like the constitution, budgets, and meeting notes."
    >
      <ul className="space-y-2 text-sm">
        {documentsForClub(clubId).map((doc) => (
          <li key={doc.id} className="flex items-center gap-2">
            <FileText size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
            <span className="flex-1 truncate">{doc.name}</span>
            <span className="shrink-0 text-xs text-gray-500">{formatShortDate(doc.uploadedAt)}</span>
          </li>
        ))}
      </ul>
      <Button variant="secondary" disabled className="mt-4 w-full">
        <Upload size={16} aria-hidden="true" />
        Upload document
      </Button>
    </ConceptCard>
  )
}
