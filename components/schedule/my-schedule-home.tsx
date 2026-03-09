"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

export function MyScheduleHome() {
  const supabase = createClient()
  const { organization } = useOrgSafe()

  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPeriods() {
      if (!organization) {
        setLoading(false)
        return
      }

      const { data } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "published")
        .order("start_date", { ascending: false })

      setPeriods((data as Period[]) || [])
      setLoading(false)
    }

    void loadPeriods()
  }, [organization?.id])

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No organization selected.</div>
  }

  if (loading) {
    return <div className="rounded-lg border bg-white p-6">Loading schedules...</div>
  }

  return (
    <div className="space-y-6">
      <OrgBrandHeader
        title={`${organization.name} Schedule`}
        subtitle="Browse all published schedule periods for your organization."
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold md:text-2xl">My Schedule</h1>
        <p className="mt-2 text-sm text-slate-600">
          Open a published period to see the full team schedule and your assigned shifts.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {periods.length === 0 ? (
          <div className="text-sm text-slate-600">No published schedules yet.</div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">{period.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {period.start_date} → {period.end_date}
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
