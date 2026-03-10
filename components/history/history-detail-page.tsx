"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { openSchedulePrintWindow } from "@/lib/schedule/print-export"
import { formatDateReadable, formatTimeRange } from "@/lib/schedule/time-format"

type ArchivePayload = {
  period?: {
    id?: string
    name?: string
    start_date?: string
    end_date?: string
    status?: string
  }
  shifts?: Array<{
    id: string
    date: string
    label: string
    start_time: string
    end_time: string
    required_workers: number
    color?: string | null
  }>
  assignments?: Array<{
    id: string
    shift_id: string
    employee_id: string | null
    manual_name: string | null
    status: string
  }>
  members?: Array<{
    id: string
    user_id: string
    display_name: string
  }>
}

type ArchiveRow = {
  id: string
  archived_at: string
  snapshot_data: ArchivePayload | null
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function weekday(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return weekdayLabels[date.getDay()]
}

function getDatesInRange(start: string, end: string) {
  const results: string[] = []
  const current = new Date(`${start}T00:00:00`)
  const last = new Date(`${end}T00:00:00`)

  while (current <= last) {
    results.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }

  return results
}

export function HistoryDetailPage({ archiveId }: { archiveId: string }) {
  const supabase = createClient()
  const { organization, isManager } = useOrgSafe()

  const [archive, setArchive] = useState<ArchiveRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  async function loadArchive() {
    if (!organization) {
      setArchive(null)
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("schedule_archives")
      .select("id, archived_at, snapshot_data")
      .eq("id", archiveId)
      .eq("organization_id", organization.id)
      .maybeSingle()

    if (error) {
      console.error("Failed to load archive", error)
      setArchive(null)
      setLoading(false)
      return
    }

    setArchive((data as ArchiveRow) || null)
    setLoading(false)
  }

  useEffect(() => {
    void loadArchive()
  }, [archiveId, organization?.id])

  const payload = archive?.snapshot_data || null
  const shifts = payload?.shifts || []
  const assignments = payload?.assignments || []
  const members = payload?.members || []
  const period = payload?.period || null

  const shiftsByDate = useMemo(() => {
    return shifts.reduce<Record<string, typeof shifts>>((acc, shift) => {
      if (!acc[shift.date]) acc[shift.date] = []
      acc[shift.date].push(shift)
      return acc
    }, {})
  }, [shifts])

  const calendarDates = useMemo(() => {
    if (!period?.start_date || !period?.end_date) return []
    return getDatesInRange(period.start_date, period.end_date)
  }, [period?.start_date, period?.end_date])

  function getAssignedNames(shiftId: string) {
    return assignments
      .filter((assignment) => assignment.shift_id === shiftId && assignment.status !== "dropped")
      .map((assignment) => {
        const member = members.find((person) => person.user_id === assignment.employee_id)
        return member?.display_name || assignment.manual_name || "Assigned"
      })
  }

  function exportArchive() {
    if (!period || !organization || !period.start_date || !period.end_date) return

    openSchedulePrintWindow({
      title: `${organization.name} — ${period.name || "Archived Schedule"}`,
      subtitle: `${formatDateReadable(period.start_date)} – ${formatDateReadable(period.end_date)} · Archived`,
      shifts,
      assignments,
      members,
      startDate: period.start_date,
      endDate: period.end_date,
    })
  }

  function renderShiftCard(shift: (typeof shifts)[number]) {
    const assigned = getAssignedNames(shift.id)

    return (
      <div
        key={shift.id}
        className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">{shift.label}</p>
            <p className="text-sm text-slate-600">
              {formatTimeRange(shift.start_time, shift.end_time)}
            </p>
          </div>

          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
            Need {shift.required_workers}
          </div>
        </div>

        <div className="mt-3">
          {assigned.length === 0 ? (
            <p className="text-sm text-slate-500">No one assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assigned.map((name, idx) => (
                <span
                  key={`${shift.id}-${idx}`}
                  className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <PageShell title="Archived schedule" subtitle="Review a previously archived schedule.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (!isManager) {
    return (
      <PageShell title="Archived schedule" subtitle="Review a previously archived schedule.">
        <SectionCard>
          <p className="text-sm text-slate-600">Only managers can view archived schedules.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell title="Archived schedule" subtitle="Review a previously archived schedule.">
        <SectionCard>
          <p className="text-sm text-slate-600">Loading archive...</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (!archive || !period || !period.start_date || !period.end_date) {
    return (
      <PageShell title="Archived schedule" subtitle="Review a previously archived schedule.">
        <SectionCard>
          <p className="text-sm text-slate-600">Archive not found.</p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <Link href="/history">Back to history</Link>
            </Button>
          </div>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={period.name || "Archived Schedule"}
      subtitle={`${formatDateReadable(period.start_date)} – ${formatDateReadable(period.end_date)}`}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant={viewMode === "calendar" ? "default" : "outline"} onClick={() => setViewMode("calendar")}>
            Weekly Calendar
          </Button>
          <Button variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            List View
          </Button>
          <Button variant="outline" onClick={exportArchive}>
            Export / Print
          </Button>
          <Button asChild variant="ghost">
            <Link href="/history">Back</Link>
          </Button>
        </div>
      }
    >
      <SectionCard
        title="Archive snapshot"
        description={`Archived on ${new Date(archive.archived_at).toLocaleString()}`}
      >
        {viewMode === "calendar" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {calendarDates.map((date) => (
              <div
                key={date}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {weekday(date)}
                  </p>
                  <p className="text-sm font-semibold text-slate-900">{formatDateReadable(date)}</p>
                </div>

                <div className="space-y-3">
                  {(shiftsByDate[date] || []).length === 0 ? (
                    <p className="text-sm text-slate-500">No shifts</p>
                  ) : (
                    (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift))
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {shifts.length === 0 ? (
              <p className="text-sm text-slate-500">No shifts in this archive.</p>
            ) : (
              shifts.map((shift) => (
                <div key={shift.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {weekday(shift.date)}
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatDateReadable(shift.date)}
                    </p>
                  </div>
                  {renderShiftCard(shift)}
                </div>
              ))
            )}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
