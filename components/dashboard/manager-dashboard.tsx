"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import type { SchedulingPeriod } from "@/lib/types"

export function ManagerDashboard() {
  const supabase = createClient()
  const { organization } = useOrgSafe()
  const [activeEmployees, setActiveEmployees] = useState(0)
  const [pendingDropRequests, setPendingDropRequests] = useState(0)
  const [currentPeriods, setCurrentPeriods] = useState<SchedulingPeriod[]>([])
  const [shiftCount, setShiftCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!organization) return

    async function loadDashboard() {
      setIsLoading(true)

      const [{ count: employeeCount }, { data: periods }] =
        await Promise.all([
          supabase
            .from("organization_members")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", organization.id)
            .eq("is_active", true),
          supabase
            .from("scheduling_periods")
            .select("*")
            .eq("organization_id", organization.id)
            .in("status", ["draft", "collecting", "scheduling", "published"])
            .order("start_date", { ascending: true })
            .limit(5),
        ])

      setActiveEmployees(employeeCount ?? 0)
      setCurrentPeriods((periods as SchedulingPeriod[]) ?? [])

      const activePeriodIds = ((periods as SchedulingPeriod[]) ?? []).map((period) => period.id)

      if (activePeriodIds.length > 0) {
        const [{ count }, { data: shiftData }] = await Promise.all([
          supabase
            .from("shifts")
            .select("*", { count: "exact", head: true })
            .in("scheduling_period_id", activePeriodIds),
          supabase
            .from("shifts")
            .select("id")
            .in("scheduling_period_id", activePeriodIds),
        ])

        setShiftCount(count ?? 0)

        const shiftIds = ((shiftData as { id: string }[]) || []).map((s) => s.id)
        if (shiftIds.length > 0) {
          const { data: assignmentData } = await supabase
            .from("shift_assignments")
            .select("id")
            .in("shift_id", shiftIds)

          const assignmentIds = ((assignmentData as { id: string }[]) || []).map((a) => a.id)

          if (assignmentIds.length > 0) {
            const { count: pendingCount } = await supabase
              .from("drop_requests")
              .select("*", { count: "exact", head: true })
              .eq("status", "pending")
              .in("assignment_id", assignmentIds)

            setPendingDropRequests(pendingCount ?? 0)
          } else {
            setPendingDropRequests(0)
          }
        } else {
          setPendingDropRequests(0)
        }
      } else {
        setShiftCount(0)
        setPendingDropRequests(0)
      }

      setIsLoading(false)
    }

    void loadDashboard()
  }, [organization?.id])

  const stats = useMemo(
    () => [
      { label: "Active employees", value: isLoading ? "—" : activeEmployees },
      { label: "Active periods", value: isLoading ? "—" : currentPeriods.length },
      { label: "Pending drop requests", value: isLoading ? "—" : pendingDropRequests },
      { label: "Shifts in active periods", value: isLoading ? "—" : shiftCount },
    ],
    [activeEmployees, currentPeriods.length, pendingDropRequests, shiftCount, isLoading]
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm font-medium text-slate-500">Manager dashboard</div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              {organization?.name || "Organization"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage your team, collect availability, and build schedules from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/schedule">Schedules</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/employees">View Employees</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/drop-requests">Drop Requests</Link>
            </Button>
          </div>
        </div>
      </div>

      <StatsCards items={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.5fr,1fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Current scheduling periods</h2>
            <Button asChild variant="ghost">
              <Link href="/schedule/new">New Period</Link>
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {currentPeriods.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-600">
                No scheduling periods yet. Create your first one to begin collecting availability.
              </div>
            ) : (
              currentPeriods.map((period) => (
                <div
                  key={period.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-slate-900">{period.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {period.start_date} → {period.end_date}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                        {period.status}
                      </span>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/schedule/${period.id}`}>Open</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Quick access</h2>
          <div className="mt-4 space-y-3 text-sm">
            <Link href="/employees" className="block rounded-lg border border-slate-200 p-4 text-slate-700 hover:bg-slate-50">
              Manage employees and roles
            </Link>
            <Link href="/drop-requests" className="block rounded-lg border border-slate-200 p-4 text-slate-700 hover:bg-slate-50">
              Review pending drop requests
            </Link>
            <Link href="/settings" className="block rounded-lg border border-slate-200 p-4 text-slate-700 hover:bg-slate-50">
              Update branding, templates, and join settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
