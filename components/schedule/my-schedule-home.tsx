"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

type AssignmentCount = {
  scheduling_period_id: string
  count: number
}

export function MyScheduleHome() {
  const supabase = createClient()
  const { organization, member, isLoading } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!organization || !member) {
        setLoading(false)
        return
      }

      setLoading(true)

      const { data: periodData, error: periodError } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "published")
        .order("start_date", { ascending: false })

      if (periodError) {
        console.error("Failed to load published periods", periodError)
        setPeriods([])
        setCounts({})
        setLoading(false)
        return
      }

      const normalizedPeriods = (periodData as Period[]) || []
      setPeriods(normalizedPeriods)

      if (normalizedPeriods.length === 0) {
        setCounts({})
        setLoading(false)
        return
      }

      const periodIds = normalizedPeriods.map((p) => p.id)

      const { data: shiftData } = await supabase
        .from("shifts")
        .select("id, scheduling_period_id")
        .in("scheduling_period_id", periodIds)

      const shiftIds = ((shiftData as { id: string; scheduling_period_id: string }[]) || []).map((s) => s.id)
      const shiftPeriodMap = Object.fromEntries(
        (((shiftData as { id: string; scheduling_period_id: string }[]) || []).map((s) => [s.id, s.scheduling_period_id]))
      )

      if (shiftIds.length === 0) {
        setCounts({})
        setLoading(false)
        return
      }

      const { data: assignmentData } = await supabase
        .from("shift_assignments")
        .select("shift_id")
        .eq("employee_id", member.user_id)
        .eq("status", "assigned")
        .in("shift_id", shiftIds)

      const nextCounts: Record<string, number> = {}
      ;((assignmentData as { shift_id: string }[]) || []).forEach((row) => {
        const periodId = shiftPeriodMap[row.shift_id]
        nextCounts[periodId] = (nextCounts[periodId] || 0) + 1
      })

      setCounts(nextCounts)
      setLoading(false)
    }

    void load()
  }, [organization?.id, member?.user_id])

  if (isLoading || loading) {
    return <div className="rounded-lg border bg-white p-6">Loading published schedules...</div>
  }

  if (!organization || !member) {
    return <div className="rounded-lg border bg-white p-6">No active organization selected.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">My Schedule</h1>
        <p className="mt-2 text-sm text-slate-600">
          View your published schedules and open a period to see your assigned shifts.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {periods.length === 0 ? (
          <div className="text-sm text-slate-600">There are no published schedules yet.</div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">{period.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {period.start_date} → {period.end_date}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {counts[period.id] || 0} assigned shift(s)
                  </div>
                </div>

                <Button asChild>
                  <Link href={`/my-schedule/${period.id}`}>Open Schedule</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
