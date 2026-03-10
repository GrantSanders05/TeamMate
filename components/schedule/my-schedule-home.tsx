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
      <PageShell title="My Schedule" subtitle="View published schedules for your active organization.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="My Schedule"
      subtitle="Open any published schedule period to review your assigned shifts."
    >
      {loading ? (
        <SectionCard>
          <p className="text-sm text-slate-600">Loading schedules…</p>
        </SectionCard>
      ) : periods.length === 0 ? (
        <SectionCard>
          <p className="text-base font-semibold text-slate-900">No published schedules yet.</p>
          <p className="mt-2 text-sm text-slate-600">
            Your manager has not published a schedule for this organization yet.
          </p>
        </SectionCard>
      ) : (
        <div className="space-y-4">
          {periods.map((period) => (
            <SectionCard key={period.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Published period
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold text-slate-900">{period.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDate(period.start_date)} – {formatDate(period.end_date)}
                  </p>
                </div>

                <div className="flex items-center">
                  <Button asChild>
                    <Link href={`/my-schedule/${period.id}`}>Open Schedule</Link>
                  </Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </PageShell>
  )
}

export default MyScheduleHome
