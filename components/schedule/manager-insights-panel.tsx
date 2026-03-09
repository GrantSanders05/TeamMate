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

export function ManagerInsightsPanel({ loads, className = "" }: ManagerInsightsPanelProps) {
  const [search, setSearch] = useState("")

  const filteredLoads = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return loads
    return loads.filter((employee) => employee.display_name.toLowerCase().includes(query))
  }, [loads, search])

  return (
    <aside className={`sticky top-4 ${className}`}>
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Balance Snapshot</h3>
            <p className="mt-1 text-sm text-slate-500">
              Live totals for every employee while you build the schedule.
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

        <div className="max-h-[34rem] space-y-2 overflow-y-auto pr-1">
          {filteredLoads.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-slate-50 p-4 text-sm text-slate-500">
              No employees found.
            </div>
          ) : (
            filteredLoads.map((employee) => (
              <div
                key={employee.user_id}
                className="rounded-2xl border bg-slate-50/80 px-3 py-3 transition-colors hover:bg-slate-50"
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
