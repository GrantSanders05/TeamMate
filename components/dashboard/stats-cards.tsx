interface StatCard {
  label: string
  value: string | number
  helper?: string
}

export function StatsCards({ items }: { items: StatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="text-sm font-medium text-slate-500">{item.label}</div>
          <div className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {item.value}
          </div>
          {item.helper ? (
            <div className="mt-1 text-xs text-slate-500">{item.helper}</div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
