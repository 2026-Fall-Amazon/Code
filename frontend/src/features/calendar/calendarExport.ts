// Add an event to the user's own calendar. Google opens a prefilled event page;
// Apple Calendar and Outlook open the downloaded .ics file.
import type { ClubEvent } from '../../lib/clubData'

type ExportEvent = Pick<ClubEvent, 'id' | 'title' | 'description' | 'startsAt' | 'endsAt' | 'location'> & {
  clubName?: string
}

const HOUR = 60 * 60 * 1000

// 2026-11-10T19:00:00.000Z → 20261110T190000Z
const stamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')

// Events without an end time are shown as one hour long.
function times(event: ExportEvent) {
  const start = new Date(event.startsAt)
  const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + HOUR)
  return { start: stamp(start), end: stamp(end) }
}

const details = (event: ExportEvent) =>
  [event.clubName && `Hosted by ${event.clubName}`, event.description].filter(Boolean).join('\n\n')

export function googleCalendarUrl(event: ExportEvent) {
  const { start, end } = times(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: details(event),
    location: event.location ?? '',
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

// Escapes text for an .ics field (RFC 5545).
const icsText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')

export function downloadIcs(event: ExportEvent) {
  const { start, end } = times(event)
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Amazon Campus//Club events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@amazon-campus`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsText(event.title)}`,
    `DESCRIPTION:${icsText(details(event))}`,
    `LOCATION:${icsText(event.location ?? '')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${event.title.replace(/[^\w -]/g, '').trim() || 'event'}.ics`
  link.click()
  // Give the browser a moment to start the download before freeing the file.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
