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
    <PageShell>
      <OrgBrandHeader
        title={`${organization.name} Schedule`}
        subtitle="Browse all published schedule periods for your organization."
      />

      <SectionCard title="My Schedule" description="Open a published period to see the full team schedule and your assigned shifts.">
        {periods.length === 0 ? (
          <div className="text-sm text-slate-600">No published schedules yet.</div>
        ) : (
          <div className="space-y-3">
            {periods.map((period) => (
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
                  <Link href={`/my-schedule/${period.id}`}>Open Schedule</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
