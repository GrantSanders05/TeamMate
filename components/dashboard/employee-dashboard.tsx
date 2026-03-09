"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"
import type { SchedulingPeriod } from "@/lib/types"

interface UpcomingShift {
  id: string
  shift_id: string
  status: string
  shifts: {
    id: string
    label: string
    date: string
    start_time: string
    end_time: string
    scheduling_period_id: string
  } | null
}

export function EmployeeDashboard() {
  const supabase = createClient()
  const { organization, member } = useOrg()
  const [collectingPeriods, setCollectingPeriods] = useState<SchedulingPeriod[]>([])
  const [upcomingShifts, setUpcomingShifts] = useState<UpcomingShift[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!organization || !member) return

    async function loadDashboard() {
      setIsLoading(true)

      const [{ data: periods }, { data: assignments }] = await Promise.all([
        supabase
          .from("scheduling_periods")
          .select("*")
          .eq("organization_id", organization.id)
          .eq("status", "collecting")
          .order("start_date", { ascending: true }),
        supabase
          .from("shift_assignments")
          .select("id, shift_id, status, shifts(id, label, date, start_time, end_time, scheduling_period_id)")
          .eq("employee_id", member.user_id)
          .eq("status", "assigned")
          .order("assigned_at", { ascending: false })
          .limit(10),
      ])

      setCollectingPeriods((periods as SchedulingPeriod[]) ?? [])
      setUpcomingShifts((assignments as UpcomingShift[]) ?? [])
      setIsLoading(false)
    }

    void loadDashboard()
  }, [organization, member, supabase])

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-medium text-slate-500">Employee dashboard</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
          {organization?.name || "Organization"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          See open availability periods, track your assignments, and stay on top of your schedule.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Available periods</h2>
          <p className="mt-1 text-sm text-slate-500">
            Submit your availability for any period currently open for responses.
          </p>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading periods...</div>
            ) : collectingPeriods.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                There are no open availability periods right now.
              </div>
            ) : (
              collectingPeriods.map((period) => (
                <div key={period.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{period.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {period.start_date} → {period.end_date}
                      </div>
                    </div>

                    <Button asChild size="sm">
                      <Link href={`/availability/${period.id}`}>Submit Availability</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">My upcoming shifts</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/my-schedule">View all</Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {isLoading ? (
              <div className="text-sm text-slate-500">Loading shifts...</div>
            ) : upcomingShifts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                No assigned shifts yet.
              </div>
            ) : (
              upcomingShifts.map((assignment) => (
                <div key={assignment.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="font-medium text-slate-900">
                    {assignment.shifts?.label || "Shift"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {assignment.shifts?.date} · {assignment.shifts?.start_time} - {assignment.shifts?.end_time}
                  </div>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/my-schedule/${assignment.shifts?.scheduling_period_id || ""}`}>
                        View Period
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
