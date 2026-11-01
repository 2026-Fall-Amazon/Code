// Inbox tab: announcements from the user's clubs, newest first.
// Officers post, members read.
//
// To build:
// - Query Announcement by clubId for each of the user's clubs, merge, and sort by publishedAt.
// - "New announcement" opens a form, shown only to officers of at least one club.
import { Plus } from 'lucide-react'
import { AnnouncementCard } from '../../components/AnnouncementCard'
import { Button } from '../../components/Button'
import { PageHeader } from '../../components/PageHeader'
import { memberships, myAnnouncements } from '../../mock/data'

export function InboxPage() {
  const isOfficer = memberships.some((m) => m.role === 'officer')

  return (
    <div>
      <PageHeader
        title="Inbox"
        subtitle="Announcements from your clubs"
        action={
          isOfficer && (
            <Button>
              <Plus size={16} aria-hidden="true" />
              New announcement
            </Button>
          )
        }
      />
      <div className="space-y-3">
        {myAnnouncements().map((a) => (
          <AnnouncementCard key={a.id} announcement={a} />
        ))}
      </div>
    </div>
  )
}
