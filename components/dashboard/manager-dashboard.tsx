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
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">{organization.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manager overview for schedules, drop requests, and active planning periods.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-slate-500">Active Periods</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{activePeriods.length}</div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-slate-500">Pending Drop Requests</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{pendingDrops}</div>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <div className="text-sm text-slate-500">All Schedule Periods</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{periods.length}</div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="mt-1 text-sm text-slate-600">Jump into your most common manager tasks.</p>
          </div>

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
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Recent Schedule Periods</h2>

        {periods.length === 0 ? (
          <div className="mt-4 text-sm text-slate-600">No schedule periods yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {periods.slice(0, 5).map((period) => (
              <div
                key={period.id}
                className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
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
      </div>
    </div>
  )
}
