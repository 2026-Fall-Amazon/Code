// Clubs (side menu): browse and search every club by name and category.
// Clubs come from the shared session; member counts and next events load here.
//
// To build:
// - With about 500 clubs, consider searching on the server instead of in the browser.
import { Search } from 'lucide-react'
import { useState } from 'react'
import { ClubCard } from '../../components/ClubCard'
import { PageHeader } from '../../components/PageHeader'
import { fetchMemberCounts, fetchUpcomingEvents, nextEventByClub } from '../../lib/clubData'
import { useClubs, useMyClubs } from '../../lib/session/hooks'
import { useLoad } from '../../lib/useLoad'

export function ClubsPage() {
  const { clubs, loading: clubsLoading, error: clubsError } = useClubs()
  const { roleIn } = useMyClubs()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')

  const { data: extras } = useLoad(clubsLoading ? null : clubs.map((club) => club.id).join(','), async () => {
    const [memberCounts, events] = await Promise.all([fetchMemberCounts(clubs), fetchUpcomingEvents()])
    return { memberCounts, nextEvents: nextEventByClub(events) }
  })

  const categories = ['All', ...new Set(clubs.flatMap((club) => (club.category ? [club.category] : [])))]
  const results = clubs
    .filter(
      (club) =>
        club.name.toLowerCase().includes(query.trim().toLowerCase()) &&
        (category === 'All' || club.category === category),
    )
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div>
      <PageHeader title="Clubs" subtitle={clubsLoading ? 'Loading clubs…' : `${clubs.length} clubs on campus`} />

      <label className="mb-3 flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 shadow-sm focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/30">
        <Search size={18} className="text-gray-400" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by club name"
          className="h-10 flex-1 bg-transparent text-sm outline-none"
        />
      </label>

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              category === c ? 'bg-squid text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {clubsError ? (
        <p role="alert" className="rounded-lg bg-white p-6 text-center text-red-700 shadow-sm">
          {clubsError}
        </p>
      ) : clubsLoading ? null : results.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-gray-600 shadow-sm">
          {clubs.length === 0 ? 'No clubs have been added yet.' : 'No clubs match your search.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {results.map((club) => (
            <ClubCard
              key={club.id}
              club={club}
              role={roleIn(club.id)}
              memberCount={extras?.memberCounts.get(club.id)}
              nextEvent={extras?.nextEvents.get(club.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
