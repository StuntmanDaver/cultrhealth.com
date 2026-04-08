'use client'

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string
  value: string
  subtitle: string
  icon: string
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-primary/10 p-6">
      <div className="flex items-start justify-between mb-2">
        <span className="text-brand-primary/60 text-sm">{title}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-display text-brand-primary mb-1">{value}</div>
      <div className="text-sm text-brand-primary/60">{subtitle}</div>
    </div>
  )
}
