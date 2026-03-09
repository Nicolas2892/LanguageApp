interface Props {
  label: string
  value: number | string
  sub?: string
}

export function AdminStatCard({ label, value, sub }: Props) {
  return (
    <div className="bg-card rounded-xl border shadow-sm p-5 space-y-1">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="text-3xl font-extrabold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}
