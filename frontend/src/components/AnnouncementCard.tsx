import { Megaphone } from 'lucide-react';
import { Link } from 'react-router';
import { clubById } from '../mock/data';

// Works with real Announcement records (Inbox) and the mock announcements other pages still use.
export type AnnouncementCardData = {
  clubId: string;
  clubName?: string;
  title: string;
  body: string;
  publishedAt?: string | null;
  createdAt?: string;
};

export function AnnouncementCard({ announcement }: { announcement: AnnouncementCardData }) {
  const clubName = announcement.clubName ?? clubById(announcement.clubId)?.name;
  const postedAt = announcement.publishedAt ?? announcement.createdAt;

  return (
    <article className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-amber-100 text-amber-600">
        <Megaphone size={24} />
      </div>
      <div className="flex flex-col min-w-0">
        <h3 className="font-bold leading-snug">{announcement.title}</h3>
        <Link to={`/clubs/${announcement.clubId}`} className="w-fit text-sm font-medium text-gray-700 hover:underline mb-1">
          {clubName}
        </Link>
        <p className="text-sm text-gray-600">{announcement.body}</p>
        {postedAt && (
          <p className="text-xs text-gray-400 mt-2">
            {new Date(postedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </article>
  );
}
