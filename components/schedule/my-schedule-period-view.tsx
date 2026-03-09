
export default function MySchedulePeriodView({ days }) {
  return (
    <div className="week-grid">
      {days.map((day) => (
        <div key={day.date}>
          <div className="text-sm font-semibold mb-2">
            {day.label}
          </div>

          <div className="space-y-2">
            {day.shifts.map((shift) => (
              <div key={shift.id} className="shift-card">
                <div className="font-semibold text-sm">
                  {shift.label}
                </div>
                <div className="text-xs text-slate-500">
                  {shift.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
