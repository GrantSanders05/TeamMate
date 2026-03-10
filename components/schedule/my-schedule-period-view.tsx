"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type ShiftCard = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
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
  display_name: string
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

function formatTimeRange(start: string, end: string) {
  const normalize = (value: string) => {
    const [hourRaw, minute = "00"] = value.split(":")
    const hourNum = Number(hourRaw)
    const suffix = hourNum >= 12 ? "PM" : "AM"
    const twelveHour = hourNum % 12 || 12
    return `${twelveHour}:${minute.slice(0, 2)} ${suffix}`
  }

  return `${normalize(start)} – ${normalize(end)}`
}

export default function MySchedulePeriodView({
  periodId,
}: {
  periodId: string
}) {
  const supabase = createClient()
  const { organization, userId } = useOrgSafe()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [periodName, setPeriodName] = useState("Schedule")
  const [shifts, setShifts] = useState<ShiftCard[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      const [{ data: periodData, error: periodError }, { data: shiftData, error: shiftError }, { data: assignmentData, error: assignmentError }, { data: memberData, error: memberError }] = await Promise.all([
        supabase
          .from("scheduling_periods")
          .select("id, name, organization_id")
          .eq("id", periodId)
          .maybeSingle(),
        supabase
          .from("shifts")
          .select("id, date, label, start_time, end_time")
          .eq("scheduling_period_id", periodId)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("shift_assignments")
          .select("id, shift_id, employee_id, manual_name, status")
          .in("shift_id",
              (await supabase
                .from("shifts")
                .select("id")
                .eq("scheduling_period_id", periodId)).data?.map((s: any) => s.id) || ["00000000-0000-0000-0000-000000000000"]),
        supabase
          .from("organization_members")
          .select("user_id, display_name")
          .eq("organization_id", organization?.id || "")
          .eq("is_active", true),
      ])

      if (!mounted) return

      if (periodError || shiftError || assignmentError || memberError) {
        setError(
          periodError?.message ||
          shiftError?.message ||
          assignmentError?.message ||
          memberError?.message ||
          "Unable to load schedule."
        )
      } else {
        setPeriodName(periodData?.name || "Schedule")
        setShifts((shiftData || []) as ShiftCard[])
        setAssignments((assignmentData || []) as Assignment[])
        setMembers((memberData || []) as Member[])
      }

      setLoading(false)
    }

    if (organization) {
      void load()
    } else {
      setLoading(false)
    }

    return () => {
      mounted = false
    }
  }, [periodId, organization?.id, supabase])

  const grouped = useMemo(() => {
    const assignmentMap = new Map<string, Assignment[]>()

    for (const assignment of assignments) {
      if (assignment.status === "dropped") continue
      const list = assignmentMap.get(assignment.shift_id) || []
      list.push(assignment)
      assignmentMap.set(assignment.shift_id, list)
    }

    const byDate = new Map<string, Array<ShiftCard & { assignments: Assignment[] }>>()

    for (const shift of shifts) {
      const list = byDate.get(shift.date) || []
      list.push({
        ...shift,
        assignments: assignmentMap.get(shift.id) || [],
      })
      byDate.set(shift.date, list)
    }

    return Array.from(byDate.entries()).map(([date, dayShifts]) => ({
      date,
      shifts: dayShifts,
    }))
  }, [shifts, assignments])

  function getAssignmentName(assignment: Assignment) {
    if (assignment.manual_name) return assignment.manual_name
    const member = members.find((item) => item.user_id === assignment.employee_id)
    return member?.display_name || "Assigned"
  }

  return (
    <PageShell
      title={periodName}
      subtitle="Published team schedule"
    >
      <SectionCard>
        {loading ? (
          <p className="text-sm text-slate-500">Loading schedule…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-slate-500">No shifts found for this schedule yet.</p>
        ) : (
          <div className="space-y-4">
            {grouped.map((day) => (
              <div key={day.date} className="soft-card p-4 sm:p-5">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900">{formatDate(day.date)}</h3>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
                    {day.shifts.length} {day.shifts.length === 1 ? "shift" : "shifts"}
                  </p>
                </div>

                <div className="grid gap-3 xl:grid-cols-2">
                  {day.shifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50"
                    >
                      <div className="border-b border-slate-200 bg-white px-4 py-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{shift.label}</p>
                            <p className="mt-1 text-sm text-slate-600">
                              {formatTimeRange(shift.start_time, shift.end_time)}
                            </p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {shift.assignments.length} assigned
                          </span>
                        </div>
                      </div>

                      <div className="px-4 py-3">
                        {shift.assignments.length === 0 ? (
                          <p className="text-sm text-slate-500">No one assigned yet.</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {shift.assignments.map((assignment) => {
                              const name = getAssignmentName(assignment)
                              const mine = Boolean(userId && assignment.employee_id === userId)

                              return (
                                <span
                                  key={assignment.id}
                                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                                    mine
                                      ? "bg-blue-600 text-white"
                                      : "bg-white text-slate-700 border border-slate-200"
                                  }`}
                                >
                                  {name}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
