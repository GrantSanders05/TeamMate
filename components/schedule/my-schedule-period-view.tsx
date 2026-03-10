"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type Shift = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
  color?: string | null
}

type Assignment = {
  id: string
  shift_id: string
  employee_id: string | null
  manual_name: string | null
  status: string
}

type Member = {
  user_id: string
  display_name: string | null
}

type PeriodRecord = {
  id: string
  name: string
  start_date: string
  end_date: string
  organization_id: string
}

function formatRange(start: string, end: string) {
  const clean = (value: string) => {
    const [hourRaw, minute = "00"] = value.split(":")
    const hour = Number(hourRaw)
    const suffix = hour >= 12 ? "PM" : "AM"
    const normalized = hour % 12 || 12
    return `${normalized}:${minute.slice(0, 2)} ${suffix}`
  }

  return `${clean(start)} – ${clean(end)}`
}

function formatDayLabel(value: string) {
  try {
    const date = new Date(`${value}T12:00:00`)
    return {
      short: date.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
      long: date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
    }
  } catch {
    return { short: value, long: value }
  }
}

function getDaysInRange(startDate: string, endDate: string) {
  const days: string[] = []
  const cursor = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)

  while (cursor <= end) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return days
}

export function MySchedulePeriodView({
  periodId,
}: {
  periodId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodRecord | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadData() {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (mounted) {
        setCurrentUserId(user?.id ?? null)
      }

      const { data: periodData, error: periodError } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, organization_id")
        .eq("id", periodId)
        .maybeSingle()

      if (periodError || !periodData) {
        if (mounted) {
          setError(periodError?.message || "Unable to load schedule period.")
          setLoading(false)
        }
        return
      }

      const [{ data: shiftData, error: shiftError }, { data: memberData, error: memberError }] =
        await Promise.all([
          supabase
            .from("shifts")
            .select("id, date, label, start_time, end_time, color")
            .eq("scheduling_period_id", periodId)
            .order("date", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase
            .from("organization_members")
            .select("user_id, display_name")
            .eq("organization_id", periodData.organization_id)
            .eq("is_active", true),
        ])

      const shiftIds = ((shiftData as Shift[]) || []).map((shift) => shift.id)
      let assignmentData: Assignment[] = []

      if (shiftIds.length > 0) {
        const { data, error: assignmentError } = await supabase
          .from("shift_assignments")
          .select("id, shift_id, employee_id, manual_name, status")
          .in("shift_id", shiftIds)
          .neq("status", "dropped")

        if (assignmentError) {
          if (mounted) {
            setError(assignmentError.message)
            setLoading(false)
          }
          return
        }

        assignmentData = (data as Assignment[]) || []
      }

      if (!mounted) return

      if (shiftError || memberError) {
        setError(shiftError?.message || memberError?.message || "Unable to load schedule.")
      } else {
        setPeriod((periodData as PeriodRecord) || null)
        setShifts((shiftData as Shift[]) || [])
        setAssignments(assignmentData)
        setMembers((memberData as Member[]) || [])
      }

      setLoading(false)
    }

    void loadData()

    return () => {
      mounted = false
    }
  }, [periodId, supabase])

  const assignmentsByShift = useMemo(() => {
    const map = new Map<string, Assignment[]>()

    for (const assignment of assignments) {
      const list = map.get(assignment.shift_id) || []
      list.push(assignment)
      map.set(assignment.shift_id, list)
    }

    return map
  }, [assignments])

  const weekDays = useMemo(() => {
    if (!period?.start_date || !period?.end_date) return []
    return getDaysInRange(period.start_date, period.end_date)
  }, [period?.start_date, period?.end_date])

  const shiftsByDate = useMemo(() => {
    const grouped = new Map<string, Shift[]>()

    for (const day of weekDays) {
      grouped.set(day, [])
    }

    for (const shift of shifts) {
      const list = grouped.get(shift.date) || []
      list.push(shift)
      grouped.set(shift.date, list)
    }

    return grouped
  }, [shifts, weekDays])

  const getDisplayName = (assignment: Assignment) => {
    const member = members.find((item) => item.user_id === assignment.employee_id)
    return member?.display_name || assignment.manual_name || "Assigned"
  }

  return (
    <PageShell
      title={period?.name || "My Schedule"}
      subtitle="Published team schedule"
    >
      <SectionCard>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="text-sm text-slate-500">Loading schedule...</p>
        ) : weekDays.length === 0 ? (
          <p className="text-sm text-slate-500">
            No shifts were found for this published period.
          </p>
        ) : (
          <>
            <div className="hidden gap-4 xl:grid xl:grid-cols-7">
              {weekDays.map((day) => {
                const labels = formatDayLabel(day)
                const dayShifts = shiftsByDate.get(day) || []

                return (
                  <div
                    key={day}
                    className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {labels.short}
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        {labels.long}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {dayShifts.length === 0 ? (
                        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                          No shifts
                        </div>
                      ) : (
                        dayShifts.map((shift) => {
                          const shiftAssignments = assignmentsByShift.get(shift.id) || []

                          return (
                            <div
                              key={shift.id}
                              className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                            >
                              <div className="flex">
                                <div
                                  className="w-1.5 shrink-0"
                                  style={{ backgroundColor: shift.color || "#2563EB" }}
                                />
                                <div className="min-w-0 flex-1 p-4">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {shift.label}
                                  </p>
                                  <p className="mt-1 text-xs font-medium text-slate-500">
                                    {formatRange(shift.start_time, shift.end_time)}
                                  </p>

                                  <div className="mt-3 space-y-2">
                                    {shiftAssignments.length === 0 ? (
                                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                        No one assigned yet
                                      </div>
                                    ) : (
                                      shiftAssignments.map((assignment) => {
                                        const mine = Boolean(
                                          currentUserId && assignment.employee_id === currentUserId
                                        )

                                        return (
                                          <div
                                            key={assignment.id}
                                            className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                                              mine
                                                ? "bg-blue-600 text-white"
                                                : "border border-slate-200 bg-slate-50 text-slate-700"
                                            }`}
                                          >
                                            <span className="truncate font-medium">
                                              {getDisplayName(assignment)}
                                            </span>
                                            {mine ? (
                                              <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
                                                You
                                              </span>
                                            ) : null}
                                          </div>
                                        )
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-4 xl:hidden">
              {weekDays.map((day) => {
                const labels = formatDayLabel(day)
                const dayShifts = shiftsByDate.get(day) || []

                return (
                  <div
                    key={day}
                    className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {labels.short}
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">
                        {labels.long}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {dayShifts.length === 0 ? (
                        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                          No shifts
                        </div>
                      ) : (
                        dayShifts.map((shift) => {
                          const shiftAssignments = assignmentsByShift.get(shift.id) || []

                          return (
                            <div
                              key={shift.id}
                              className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
                            >
                              <div className="flex">
                                <div
                                  className="w-1.5 shrink-0"
                                  style={{ backgroundColor: shift.color || "#2563EB" }}
                                />
                                <div className="min-w-0 flex-1 p-4">
                                  <p className="truncate text-sm font-semibold text-slate-900">
                                    {shift.label}
                                  </p>
                                  <p className="mt-1 text-xs font-medium text-slate-500">
                                    {formatRange(shift.start_time, shift.end_time)}
                                  </p>

                                  <div className="mt-3 space-y-2">
                                    {shiftAssignments.length === 0 ? (
                                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                                        No one assigned yet
                                      </div>
                                    ) : (
                                      shiftAssignments.map((assignment) => {
                                        const mine = Boolean(
                                          currentUserId && assignment.employee_id === currentUserId
                                        )

                                        return (
                                          <div
                                            key={assignment.id}
                                            className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2 text-sm ${
                                              mine
                                                ? "bg-blue-600 text-white"
                                                : "border border-slate-200 bg-slate-50 text-slate-700"
                                            }`}
                                          >
                                            <span className="truncate font-medium">
                                              {getDisplayName(assignment)}
                                            </span>
                                            {mine ? (
                                              <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
                                                You
                                              </span>
                                            ) : null}
                                          </div>
                                        )
                                      })
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </SectionCard>
    </PageShell>
  )
}

export default MySchedulePeriodView
