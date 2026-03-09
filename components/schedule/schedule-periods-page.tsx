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
  period_type: string
}

export function SchedulePeriodsPage() {
  const supabase = createClient()
  const { organization, isManager, isLoading } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  async function loadPeriods() {
    if (!organization) {
      setPeriods([])
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from("scheduling_periods")
      .select("id, name, start_date, end_date, status, period_type")
      .eq("organization_id", organization.id)
      .order("start_date", { ascending: false })

    if (error) {
      console.error("Failed to load scheduling periods", error)
      setPeriods([])
      setLoading(false)
      return
    }

    setPeriods((data as Period[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadPeriods()
  }, [organization?.id])

  if (isLoading || loading) {
    return <div className="rounded-lg border bg-white p-6">Loading schedules...</div>
  }

  if (!organization) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">Schedules</h1>
        <p className="mt-2 text-sm text-slate-600">
          Select or create an organization before creating schedules.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Schedules</h1>
            <p className="mt-1 text-sm text-slate-600">
              Create scheduling periods and open each one to build assignments.
            </p>
          </div>
          {isManager ? (
            <Button asChild>
              <Link href="/schedule/new">New Schedule</Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {periods.length === 0 ? (
          <div className="text-sm text-slate-600">
            No scheduling periods yet. Click <strong>New Schedule</strong> to create one.
          </div>
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
                    {period.start_date} → {period.end_date} · {period.period_type} · {period.status}
                  </div>
                </div>

                <Button asChild variant="outline">
                  <Link href={`/schedule/${period.id}`}>Open Builder</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
