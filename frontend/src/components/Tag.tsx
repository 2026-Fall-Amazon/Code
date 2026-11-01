import type { ReactNode } from 'react'

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-page px-2.5 py-0.5 text-xs font-medium text-gray-700">{children}</span>
}

export function RoleBadge({ role }: { role: 'member' | 'officer' }) {
  return role === 'officer' ? (
    <span className="rounded-full bg-squid px-2 py-0.5 text-xs font-semibold text-brand">Officer</span>
  ) : (
    <span className="rounded-full bg-page px-2 py-0.5 text-xs font-medium text-gray-700">Member</span>
  )
}
