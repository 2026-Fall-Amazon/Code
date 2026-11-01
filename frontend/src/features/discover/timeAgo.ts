import { formatShortDate } from '../../lib/format'

const relative = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto', style: 'narrow' })

// "just now", "5m ago", "3h ago", "yesterday", "2d ago", then the date once it's a week old.
export function timeAgo(iso: string, now = Date.now()) {
  const minutes = Math.round((now - Date.parse(iso)) / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return relative.format(-minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (hours < 24) return relative.format(-hours, 'hour')
  const days = Math.round(hours / 24)
  if (days < 7) return relative.format(-days, 'day')
  return formatShortDate(iso)
}
