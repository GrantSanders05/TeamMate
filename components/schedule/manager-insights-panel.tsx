"use client"

import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"

type EmployeeLoad = {
  user_id: string
  display_name: string
  hours: number
  shiftCount: number
}

type ManagerInsightsPanelProps = {
  loads: EmployeeLoad[]
  understaffedShiftCount: number
  className?: string
}

export function ManagerInsightsPanel({
  loads,
  understaffedShiftCount,
  className = "",
}: ManagerInsightsPanelProps) {
  const [search, setSearch] = useState("")

  const averageHours = useMemo(() => {
    if (loads.length === 0) return 0
    return loads.reduce((sum, employee) => sum + employee.hours, 0) / loads.length
  }, [loads])

  const highLoad = useMemo(() => {
    return loads.filter((employee) => employee.hours > averageHours + 2).length
  }, [loads, averageHours])

  const lowLoad = useMemo(() => {
    return loads.filter((employee) => employee.hours < Math.max(averageHours - 2, 0)).length
  }, [loads, averageHours])

  const filteredLoads = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return loads
    return loads.filter((employee) => employee.display_name.toLowerCase().includes(query))
  }, [loads, search])

  return (
    <aside className={`sticky top-4 space-y-4 ${className}`}>
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Manager Insights</h3>
          <p className="mt-1 text-sm text-slate-500">
            Use these live highlights to keep staffing balanced and catch weak spots quickly.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-slate-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Average Hours</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{averageHours.toFixed(1)}</div>
          </div>
          <div className="rounded-xl border bg-amber-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-amber-700">Understaffed</div>
            <div className="mt-1 text-xl font-semibold text-amber-900">{understaffedShiftCount}</div>
          </div>
          <div className="rounded-xl border bg-emerald-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-emerald-700">High Load</div>
            <div className="mt-1 text-xl font-semibold text-emerald-900">{highLoad}</div>
          </div>
          <div className="rounded-xl border bg-sky-50 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-sky-700">Low Load</div>
            <div className="mt-1 text-xl font-semibold text-sky-900">{lowLoad}</div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Balance Snapshot</h3>
            <p className="mt-1 text-sm text-slate-500">
              Sticky live view of every employee’s total shifts and scheduled hours.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {loads.length} employee{loads.length === 1 ? "" : "s"}
          </div>
        </div>

        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search employees"
          className="mb-4"
        />

        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
          {filteredLoads.length === 0 ? (
            <div className="rounded-xl border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
              No employees found.
            </div>
          ) : (
            filteredLoads.map((employee) => (
              <div
                key={employee.user_id}
                className="rounded-xl border bg-slate-50/80 px-3 py-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {employee.display_name}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {employee.shiftCount} shift{employee.shiftCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-slate-900">
                      {employee.hours.toFixed(1)} hrs
                    </div>
                    <div className="mt-1 text-xs text-slate-500">scheduled</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  )
}
