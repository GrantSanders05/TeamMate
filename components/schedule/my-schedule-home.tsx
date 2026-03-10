"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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

function formatDateRange(start: string, end: string) {
  try {
    const startDate = new Date(start)
    const endDate = new Date(end)
    return `${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}`
  } catch {
    return `${start} – ${end}`
  }
}

export function MyScheduleHome() {
  const supabase = useMemo(() => createClient(), [])
  const { organization } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPeriods() {
      if (!organization?.id) {
        setPeriods([])
        setLoading(false)
        return
      }

      setLoading(true)
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
  }, [organization?.id, supabase])

  return (
    <PageShell
      title="My Schedule"
      subtitle="View your published schedules and open a specific period."
    >
      {!organization ? (
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      ) : loading ? (
        <SectionCard>
          <p className="text-sm text-slate-600">Loading schedules...</p>
        </SectionCard>
      ) : periods.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-slate-600">No published schedules yet.</p>
        </SectionCard>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {periods.map((period) => (
            <SectionCard key={period.id} title={period.name} description={formatDateRange(period.start_date, period.end_date)}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  Published
                </span>
                <Link
                  href={`/my-schedule/${period.id}`}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
                >
                  Open Schedule
                </Link>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </PageShell>
  )
}
