import { Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'

// Marks features that are out of scope for the MVP. They appear in the demo to show
// where they would go, but nothing behind them works.
export function ConceptBadge() {
  return (
    <span
      title="Concept preview: shows where this would go in a full product. Not built."
      className="inline-flex shrink-0 items-center gap-1 rounded-full border border-brand bg-brand/10 px-2 py-0.5 text-xs font-semibold text-amber-800"
    >
      <Sparkles size={12} aria-hidden="true" />
      Concept
    </span>
  )
}

type ConceptCardProps = {
  title: string
  description?: string
  children?: ReactNode
  className?: string
}

export function ConceptCard({ title, description, children, className = '' }: ConceptCardProps) {
  return (
    <section className={`rounded-lg border-2 border-dashed border-brand-soft bg-white p-4 shadow-sm ${className}`}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <h2 className="text-lg font-bold">{title}</h2>
        <ConceptBadge />
      </div>
      {description && <p className="mb-3 text-sm text-gray-600">{description}</p>}
      {children}
    </section>
  )
}
