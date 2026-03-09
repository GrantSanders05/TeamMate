import { ScheduleShiftCard } from "./schedule-shift-card"

export function CalendarView({
  days,
}: {
  days: { date: string; shifts: any[] }[]
}) {
  return (
    <div className="grid gap-4 md:grid-cols-7">
      {days.map((day) => (
        <div key={day.date} className="rounded-2xl border bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-500">
            {day.date}
          </div>

          <div className="space-y-2">
            {day.shifts.map((s) => (
              <ScheduleShiftCard key={s.id} {...s} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
