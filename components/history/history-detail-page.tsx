"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { openSchedulePrintWindow } from "@/lib/schedule/print-export"
import { formatDateReadable, formatTimeRange } from "@/lib/schedule/time-format"

type ArchivePayload = {
  period?: {
    id: string
    name: string
    start_date: string
    end_date: string
    status: string
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
  const date = new Date(dateString + "T00:00:00")
  return weekdayLabels[date.getDay()]
}

function getDatesInRange(start: string, end: string) {
  const results: string[] = []
  const current = new Date(start + "T00:00:00")
  const last = new Date(end + "T00:00:00")
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
    if (!period || !organization) return

    openSchedulePrintWindow({
      title: `${organization.name} — ${period.name}`,
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
        className="rounded-lg border p-3"
        style={{ borderLeftWidth: "6px", borderLeftColor: shift.color || "#3B82F6" }}
      >
        <div className="font-medium text-slate-900">{shift.label}</div>
        <div className="mt-1 text-xs text-slate-600">
          {formatTimeRange(shift.start_time, shift.end_time)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {assigned.length === 0 ? (
            <span className="text-xs text-slate-500">No one assigned.</span>
          ) : (
            assigned.map((name, idx) => (
              <span key={`${shift.id}-${idx}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                {name}
              </span>
            ))
          )}
        </div>
      </div>
    )
  }

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No organization selected.</div>
  }

  if (!isManager) {
    return <div className="rounded-lg border bg-white p-6">Only managers can view archived schedules.</div>
  }

  if (loading) {
    return <div className="rounded-lg border bg-white p-6">Loading archive...</div>
  }

  if (!archive || !period) {
    return <div className="rounded-lg border bg-white p-6">Archive not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{period.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDateReadable(period.start_date)} – {formatDateReadable(period.end_date)} · Archived
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Archived on {new Date(archive.archived_at).toLocaleString()}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              Weekly Calendar
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button type="button" variant="outline" onClick={exportArchive}>
              Export / Print
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Archived Calendar View</h2>

          <div className="mt-4 overflow-x-auto">
            <div className="grid min-w-[1100px] grid-cols-7 gap-4">
              {calendarDates.map((date) => (
                <div key={date} className="rounded-lg border bg-slate-50 p-3">
                  <div className="border-b pb-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {weekday(date)}
                    </div>
                    <div className="mt-1 text-sm font-medium text-slate-900">
                      {formatDateReadable(date)}
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    {(shiftsByDate[date] || []).length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-white p-3 text-xs text-slate-500">
                        No shifts
                      </div>
                    ) : (
                      (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold">Archived List View</h2>

          {shifts.length === 0 ? (
            <div className="mt-4 text-sm text-slate-600">No shifts in this archive.</div>
          ) : (
            <div className="mt-4 space-y-4">
              {shifts.map((shift) => renderShiftCard(shift))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
