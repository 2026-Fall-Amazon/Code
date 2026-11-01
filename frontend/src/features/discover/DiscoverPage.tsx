// Discover (side menu): the For You feed of upcoming events.
// York owns the ranking algorithm.
//
// To build:
// - Replace rankForYou() with the real ranking (interests, clubs, timing, RSVPs).
//   It will likely run in a Lambda so every client ranks the same way.
// - "If time allows" in the overview: AI-generated event tags.
import { useState } from 'react'
import { EventCard } from '../../components/EventCard'
import { PageHeader } from '../../components/PageHeader'
import { currentUser, events, roleIn } from '../../mock/data'
import type { ClubEvent } from '../../mock/types'

// Placeholder ranking: soonest first, with a short reason for each event.
function rankForYou(list: ClubEvent[]) {
  return [...list]
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((event) => {
      const sharedInterest = event.tags.find((tag) => currentUser.interests.includes(tag))
      const reason = roleIn(event.clubId)
        ? 'From your club'
        : sharedInterest
          ? `Because you like ${sharedInterest}`
          : 'Happening soon'
      return { event, reason }
    })
}

const filters = ['For you', 'My clubs'] as const

export function DiscoverPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>('For you')
  const feed = rankForYou(filter === 'My clubs' ? events.filter((e) => roleIn(e.clubId)) : events)

  return (
    <div>
      <PageHeader title="Discover" subtitle="Upcoming events picked for you" />
      <div className="mb-4 flex gap-2" role="tablist">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              filter === f ? 'bg-squid text-white' : 'bg-white text-gray-700 shadow-sm hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {feed.map(({ event, reason }) => (
          <EventCard key={event.id} event={event} reason={reason} />
        ))}
      </div>
    </div>
  )
}
