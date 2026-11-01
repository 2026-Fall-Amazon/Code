const eventTime = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
const dayHeading = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const timeOnly = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' })
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

// Date-only strings ('2026-11-15') are read as UTC midnight, which shows as the day before
// in US time zones. Treat them as local noon instead.
const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00` : iso)

export const formatEventTime = (iso: string) => eventTime.format(toDate(iso))
export const formatShortDate = (iso: string) => shortDate.format(toDate(iso))
export const formatDayHeading = (iso: string) => dayHeading.format(toDate(iso))
export const formatTime = (iso: string) => timeOnly.format(toDate(iso))
export const formatMoney = (amount: number) => money.format(amount)
