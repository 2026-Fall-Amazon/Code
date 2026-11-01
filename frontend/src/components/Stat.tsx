type StatProps = {
  label: string
  value: string
  tone?: 'default' | 'positive' | 'negative'
  size?: 'lg' | 'sm'
}

const tones = {
  default: 'text-ink',
  positive: 'text-green-700',
  negative: 'text-red-700',
}

// A large number with a small label, for member counts and money.
export function Stat({ label, value, tone = 'default', size = 'lg' }: StatProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`font-bold tabular-nums ${size === 'lg' ? 'text-3xl' : 'text-lg'} ${tones[tone]}`}>{value}</p>
    </div>
  )
}
