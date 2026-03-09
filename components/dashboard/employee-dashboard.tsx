"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

type MyShift = {
  shift_id: string
  label: string
  date: string
  start_time: string
  end_time: string
  period_id: string
  period_name: string
}

export function EmployeeDashboard() {
  const supabase = createClient()
  const { organization, member } = useOrgSafe()

  const [collectingPeriods, setCollectingPeriods] = useState<Period[]>([])
  const [myShifts, setMyShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      if (!organization || !member?.user_id) {
        setLoading(false)
        return
      }

      const { data: periodsData } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "collecting")
        .order("start_date", { ascending: true })

      const { data: publishedPeriods } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "published")

      let loadedShifts: MyShift[] = []

      if ((publishedPeriods || []).length > 0) {
        const publishedIds = (publishedPeriods || []).map((p: any) => p.id)

        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("id, label, date, start_time, end_time, scheduling_period_id")
          .in("scheduling_period_id", publishedIds)

        const shiftIds = (shiftsData || []).map((shift: any) => shift.id)

        if (shiftIds.length > 0) {
          const { data: assignmentData } = await supabase
            .from("shift_assignments")
            .select("shift_id, employee_id, status")
            .eq("employee_id", member.user_id)
            .eq("status", "assigned")
            .in("shift_id", shiftIds)

          const assignedShiftIds = new Set((assignmentData || []).map((a: any) => a.shift_id))

          loadedShifts = (shiftsData || [])
            .filter((shift: any) => assignedShiftIds.has(shift.id))
            .map((shift: any) => {
              const period = (publishedPeriods || []).find((p: any) => p.id === shift.scheduling_period_id)
              return {
                shift_id: shift.id,
                label: shift.label,
                date: shift.date,
                start_time: shift.start_time,
                end_time: shift.end_time,
                period_id: shift.scheduling_period_id,
                period_name: period?.name || "Published Period",
              }
            })
            .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`))
        }
      }

      setCollectingPeriods((periodsData as Period[]) || [])
      setMyShifts(loadedShifts)
      setLoading(false)
    }

    void loadDashboard()
  }, [organization?.id, member?.user_id])

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No organization selected.</div>
  }

  if (loading) {
    return <div className="rounded-lg border bg-white p-6">Loading dashboard...</div>
  }

  return (
    <PageShell>
      <OrgBrandHeader
        title={organization.name}
        subtitle="Your team schedule, upcoming shifts, and availability in one place."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard className="bg-gradient-to-br from-blue-50 to-white">
          <div className="text-sm text-slate-500">Open Availability Periods</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{collectingPeriods.length}</div>
        </SectionCard>

        <SectionCard className="bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-sm text-slate-500">Upcoming Assigned Shifts</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{myShifts.length}</div>
        </SectionCard>
      </div>

      <SectionCard title="Available Shifts">
        {collectingPeriods.length === 0 ? (
          <div className="mt-1 text-sm text-slate-600">No open availability periods right now.</div>
        ) : (
          <div className="space-y-3">
            {collectingPeriods.map((period) => (
              <div
                key={period.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">{period.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {period.start_date} → {period.end_date}
                  </div>
                </div>

                <Button asChild>
                  <Link href={`/availability/${period.id}`}>Submit Availability</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="My Upcoming Shifts">
        <div className="mb-4">
          <Button asChild variant="outline">
            <Link href="/my-schedule">Open Full Schedule</Link>
          </Button>
        </div>
        {myShifts.length === 0 ? (
          <div className="text-sm text-slate-600">No upcoming published shifts assigned yet.</div>
        ) : (
          <div className="space-y-3">
            {myShifts.slice(0, 5).map((shift) => (
              <div key={shift.shift_id} className="rounded-2xl border border-slate-200 p-4">
                <div className="font-medium text-slate-900">{shift.label}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {shift.date} · {shift.start_time} - {shift.end_time}
                </div>
                <div className="mt-1 text-xs text-slate-500">{shift.period_name}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
