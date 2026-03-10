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
  className?: string
}

export function ManagerInsightsPanel({
  loads,
  className = "",
}: ManagerInsightsPanelProps) {
  const [search, setSearch] = useState("")

  const filteredLoads = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return loads

    return loads.filter((employee) =>
      employee.display_name.toLowerCase().includes(query)
    )
  }, [loads, search])

  return (
    <aside
      className={`rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm ${className}`.trim()}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Balance Snapshot
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Live totals for every employee while you build the schedule.
          </p>
        </div>

        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
          {loads.length} employee{loads.length === 1 ? "" : "s"}
        </span>
      </div>

      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search employees"
        className="mb-4 rounded-2xl"
      />

      {filteredLoads.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          No employees found.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLoads.map((employee) => (
            <div
              key={employee.user_id}
              className="rounded-[20px] border border-slate-200 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {employee.display_name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    scheduled load
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {employee.shiftCount} shift{employee.shiftCount === 1 ? "" : "s"}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    {employee.hours.toFixed(1)} hrs
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  )
}
