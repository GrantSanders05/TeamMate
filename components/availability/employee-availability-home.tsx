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

export function EmployeeAvailabilityHome() {
  const supabase = createClient()
  const { organization, isLoading } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPeriods() {
      if (!organization) {
        setPeriods([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "collecting")
        .order("start_date", { ascending: true })

      if (error) {
        console.error("Failed to load availability periods", error)
        setPeriods([])
        setLoading(false)
        return
      }

      setPeriods((data as Period[]) || [])
      setLoading(false)
    }

    void loadPeriods()
  }, [organization?.id])

  if (isLoading || loading) {
    return <div className="rounded-lg border bg-white p-6">Loading availability periods...</div>
  }

  if (!organization) {
    return (
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">Available Shifts</h1>
        <p className="mt-2 text-sm text-slate-600">
          No active organization is selected.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <OrgBrandHeader
        title={`${organization.name} Availability`}
        subtitle="Open periods where your team is currently collecting availability."
      />

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold md:text-2xl">Available Shifts</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose an active schedule period to submit your availability.
        </p>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        {periods.length === 0 ? (
          <div className="text-sm text-slate-600">
            There are no open availability periods right now.
          </div>
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
                  <Link href={`/availability/${period.id}`}>Submit Availability</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
