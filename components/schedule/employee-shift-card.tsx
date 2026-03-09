export function EmployeeShiftCard({
  title,
  date,
  start,
  end,
  location,
}: {
  title: string
  date: string
  start: string
  end: string
  location?: string
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition">
      <div className="text-xs uppercase text-slate-500">{date}</div>
      <div className="mt-1 font-semibold text-slate-900">{title}</div>
      <div className="text-sm text-slate-600">
        {start} – {end}
      </div>
      {location && (
        <div className="mt-1 text-xs text-slate-500">{location}</div>
      )}
      <button className="mt-3 w-full rounded-xl bg-slate-900 py-2 text-sm text-white">
        Request Drop
      </button>
    </div>
  )
}
