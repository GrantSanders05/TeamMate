"use client"

type EmployeeLoad = {
  user_id: string
  display_name: string
  shiftCount: number
  hours: number
}

export function ManagerInsightsPanel({
  loads,
  understaffedShiftCount,
}: {
  loads: EmployeeLoad[]
  understaffedShiftCount: number
}) {
  const totalHours = loads.reduce((sum, item) => sum + item.hours, 0)
  const avgHours = loads.length ? totalHours / loads.length : 0
  const highLoad = loads.filter((item) => item.hours >= avgHours + 6).length
  const lowLoad = loads.filter((item) => item.hours <= Math.max(avgHours - 6, 0)).length

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Manager Insights</h3>
        <p className="mt-1 text-sm text-slate-600">
          Use these live highlights to keep staffing balanced and catch weak spots quickly.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-blue-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-blue-700">Average Hours</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{avgHours.toFixed(1)}</div>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-amber-700">Understaffed</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{understaffedShiftCount}</div>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-rose-700">High Load</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{highLoad}</div>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3">
            <div className="text-[11px] uppercase tracking-wide text-emerald-700">Low Load</div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">{lowLoad}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Balance Snapshot</h3>
        <div className="mt-4 space-y-3">
          {loads.slice(0, 5).map((employee) => (
            <div key={employee.user_id} className="rounded-2xl border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="font-medium text-slate-900">{employee.display_name}</div>
                <div className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {employee.hours.toFixed(1)} hrs
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  className="h-2 rounded-full bg-slate-900"
                  style={{ width: `${Math.min((employee.hours / 40) * 100, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">{employee.shiftCount} shift(s)</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
