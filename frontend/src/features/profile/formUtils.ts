// Plain helpers for the profile forms. Kept out of fields.tsx so that file
// only exports components, which is what React Fast Refresh needs.

export const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'

// The four class years a current student is most likely to pick.
// After June the first choice rolls forward, so it stays useful year to year.
export function graduationYearChoices(now = new Date()) {
  const first = now.getFullYear() + (now.getMonth() >= 6 ? 1 : 0)
  return [first, first + 1, first + 2, first + 3]
}

// Returns an error message, or null when the year is usable.
export function validateGraduationYear(raw: string) {
  if (!raw.trim()) return 'Please choose your graduation year.'
  const year = Number(raw)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    return 'Graduation year must be a four-digit year, like 2029.'
  }
  return null
}
