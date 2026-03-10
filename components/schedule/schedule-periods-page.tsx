"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { formatDisplayDate } from "@/lib/date-format"

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
      .neq("status", "archived")
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
    return <div className="section-card text-sm text-slate-600">Loading schedules...</div>
  }

  if (!organization) {
    return (
      <section className="section-card">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">Schedules</h1>
        <p className="mt-3 text-sm text-slate-600">Select or create an organization before creating schedules.</p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="section-card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Schedules</h1>
          <p className="mt-2 text-sm text-slate-600">
            Active schedule periods only. Archived periods now move out of this page.
          </p>
        </div>

        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/history">Archived</Link>
          </Button>
          {isManager ? (
            <Button asChild className="rounded-2xl">
              <Link href="/schedule/new">New Schedule</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {periods.length === 0 ? (
        <div className="section-card text-sm text-slate-600">No active scheduling periods right now.</div>
      ) : (
        <div className="grid gap-4">
          {periods.map((period) => (
            <div key={period.id} className="section-card flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{period.name}</h2>
                <p className="mt-2 text-sm text-slate-600">
                  {formatDisplayDate(period.start_date)} – {formatDisplayDate(period.end_date)}
                </p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {period.period_type} · {period.status}
                </p>
              </div>

              <Button asChild className="rounded-2xl md:self-start">
                <Link href={`/schedule/${period.id}`}>Open Builder</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
