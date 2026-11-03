import type { ReactNode } from 'react'

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-page px-2.5 py-0.5 text-xs font-medium text-gray-700">{children}</span>
}

const roleLabels = { leader: 'Leader', poster: 'Poster', member: 'Member' } as const

// leader and poster come from ClubRole; member means a Membership with no role.
export function RoleBadge({ role }: { role: keyof typeof roleLabels }) {
  return role === 'member' ? (
    <span className="rounded-full bg-page px-2 py-0.5 text-xs font-medium text-gray-700">Member</span>
  ) : (
    <span className="rounded-full bg-squid px-2 py-0.5 text-xs font-semibold text-brand">{roleLabels[role]}</span>
  )
}
