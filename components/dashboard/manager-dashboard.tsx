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

export function ManagerDashboard() {
  const supabase = createClient()
  const { organization } = useOrgSafe()

  const [periods, setPeriods] = useState<Period[]>([])
  const [pendingDrops, setPendingDrops] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      if (!organization) {
        setLoading(false)
        return
      }

      const { data: periodData } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .order("start_date", { ascending: false })

      const { data: dropData } = await supabase
        .from("drop_requests")
        .select("id, status")
        .eq("status", "pending")

      setPeriods((periodData as Period[]) || [])
      setPendingDrops((dropData || []).length)
      setLoading(false)
    }

    void loadDashboard()
  }, [organization?.id])

  const activePeriods = periods.filter((period) =>
    ["draft", "collecting", "scheduling", "published"].includes(period.status)
  )

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
        subtitle="Manager overview for schedules, staffing, and drop requests."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard className="bg-gradient-to-br from-blue-50 to-white">
          <div className="text-sm text-slate-500">Active Periods</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{activePeriods.length}</div>
        </SectionCard>

        <SectionCard className="bg-gradient-to-br from-amber-50 to-white">
          <div className="text-sm text-slate-500">Pending Drop Requests</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{pendingDrops}</div>
        </SectionCard>

        <SectionCard className="bg-gradient-to-br from-emerald-50 to-white">
          <div className="text-sm text-slate-500">All Schedule Periods</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{periods.length}</div>
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions" description="Jump into your most common manager tasks.">
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/schedule">Open Schedules</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/drop-requests">Review Drops</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">Settings</Link>
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Recent Schedule Periods">
        {periods.length === 0 ? (
          <div className="text-sm text-slate-600">No schedule periods yet.</div>
        ) : (
          <div className="space-y-3">
            {periods.slice(0, 5).map((period) => (
              <div
                key={period.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-medium text-slate-900">{period.name}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {period.start_date} → {period.end_date} · {period.status}
                  </div>
                </div>

                <Button asChild variant="outline">
                  <Link href={`/schedule/${period.id}`}>Open</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
