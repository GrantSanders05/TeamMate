export function ScheduleShiftCard({
  title,
  date,
  start,
  end,
  employees,
}: {
  title: string
  date: string
  start: string
  end: string
  employees: string[]
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-slate-900">{title}</div>
          <div className="text-sm text-slate-600">
            {date} • {start} – {end}
          </div>
        </div>
        <div className="text-xs rounded-full bg-blue-100 px-3 py-1 text-blue-700">
          {employees.length} assigned
        </div>
      </div>

      {employees.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {employees.map((e) => (
            <span
              key={e}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
            >
              {e}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
