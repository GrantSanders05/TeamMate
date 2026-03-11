import { ArrowUpRight } from "lucide-react"

type StatCard = {
  label: string
  value: string | number
  helper?: string
}

export function StatsCards({ items }: { items: StatCard[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                {item.value}
              </p>
            </div>

            <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>

          {item.helper ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {item.helper}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
