"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { formatDisplayDate } from "@/lib/date-format"

type ArchiveRecord = {
  id: string
  archived_at: string
  scheduling_period_id: string
  snapshot_data: {
    period?: {
      name?: string
      start_date?: string
      end_date?: string
    }
  } | null
}

type ArchivedPeriod = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  created_at?: string
}

export function ScheduleArchivesPage() {
  const supabase = createClient()
  const { organization, isLoading } = useOrgSafe()
  const [archives, setArchives] = useState<ArchiveRecord[]>([])
  const [archivedPeriods, setArchivedPeriods] = useState<ArchivedPeriod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!organization) {
        setArchives([])
        setArchivedPeriods([])
        setLoading(false)
        return
      }

      const [{ data: archiveData }, { data: periodData }] = await Promise.all([
        supabase
          .from("schedule_archives")
          .select("id, archived_at, scheduling_period_id, snapshot_data")
          .eq("organization_id", organization.id)
          .order("archived_at", { ascending: false }),
        supabase
          .from("scheduling_periods")
          .select("id, name, start_date, end_date, status, created_at")
          .eq("organization_id", organization.id)
          .eq("status", "archived")
          .order("start_date", { ascending: false }),
      ])

      setArchives((archiveData as ArchiveRecord[]) || [])
      setArchivedPeriods((periodData as ArchivedPeriod[]) || [])
      setLoading(false)
    }

    void load()
  }, [organization?.id])

  if (isLoading || loading) {
    return <div className="section-card text-sm text-slate-600">Loading archived schedules...</div>
  }

  return (
    <section className="space-y-6">
      <div className="section-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Archived schedules</h1>
          <p className="mt-2 text-sm text-slate-600">
            Archived schedule periods live here instead of the active schedules page.
          </p>
        </div>
        <Link href="/schedule" className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline">
          Back to schedules
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="section-card space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Archived periods</h2>
            <p className="mt-1 text-sm text-slate-600">These are the live period records that have been moved to archived status.</p>
          </div>

          {archivedPeriods.length === 0 ? (
            <p className="text-sm text-slate-600">No archived periods found yet.</p>
          ) : (
            <div className="space-y-3">
              {archivedPeriods.map((period) => (
                <div key={period.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold text-slate-950">{period.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatDisplayDate(period.start_date)} – {formatDisplayDate(period.end_date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="section-card space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Archive snapshots</h2>
            <p className="mt-1 text-sm text-slate-600">These are the stored archive snapshots for historical reference.</p>
          </div>

          {archives.length === 0 ? (
            <p className="text-sm text-slate-600">No archive snapshots found yet.</p>
          ) : (
            <div className="space-y-3">
              {archives.map((archive) => {
                const period = archive.snapshot_data?.period
                return (
                  <div key={archive.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="text-base font-semibold text-slate-950">
                      {period?.name || `Archived period ${archive.scheduling_period_id.slice(0, 8)}`}
                    </h3>
                    {period?.start_date && period?.end_date ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {formatDisplayDate(period.start_date)} – {formatDisplayDate(period.end_date)}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Archived {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(archive.archived_at))}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
