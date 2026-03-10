"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function MyScheduleHome() {
  const supabase = createClient()
  const { organization } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadPeriods() {
      if (!organization) {
        if (mounted) setLoading(false)
        return
      }

      const { data } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "published")
        .order("start_date", { ascending: false })

      if (!mounted) return

      setPeriods((data as Period[]) || [])
      setLoading(false)
    }

    void loadPeriods()

    return () => {
      mounted = false
    }
  }, [organization?.id, supabase])

  if (!organization) {
    return (
      <PageShell title="My Schedule" subtitle="View your published team schedules.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="My Schedule"
      subtitle="Open any published period to view the team schedule and your upcoming shifts."
    >
      <SectionCard>
        {loading ? (
          <p className="text-sm text-slate-500">Loading schedules…</p>
        ) : periods.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-sm font-medium text-slate-700">No published schedules yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Your manager has not published a schedule for this organization yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className="soft-card flex h-full flex-col justify-between p-5"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Published period
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">
                    {period.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(period.start_date)} – {formatDate(period.end_date)}
                  </p>
                </div>

                <div className="mt-5">
                  <Link href={`/my-schedule/${period.id}`}>
                    <Button className="w-full rounded-2xl">Open Schedule</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
