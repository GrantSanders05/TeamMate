"use client"

import { Button } from "@/components/ui/button"

type RecommendedEmployee = {
  user_id: string
  display_name: string
  shiftCount: number
  hours: number
}

export function QuickAssignPanel({
  shiftLabel,
  recommended,
  onAssign,
}: {
  shiftLabel: string
  recommended: RecommendedEmployee[]
  onAssign: (employeeId: string) => void
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Quick Assign</h3>
      <p className="mt-1 text-sm text-slate-600">
        Recommended available employees for {shiftLabel}.
      </p>

      <div className="mt-4 space-y-3">
        {recommended.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
            No recommended employees for this shift yet.
          </div>
        ) : (
          recommended.map((employee) => (
            <div
              key={employee.user_id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3"
            >
              <div>
                <div className="font-medium text-slate-900">{employee.display_name}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {employee.shiftCount} shift(s) · {employee.hours.toFixed(1)} hrs
                </div>
              </div>

              <Button size="sm" onClick={() => onAssign(employee.user_id)}>
                Assign
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
