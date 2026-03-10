"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, Clock3 } from "lucide-react"

import { createClient } from "@/lib/supabase/client"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { Button } from "@/components/ui/button"

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

type DropRequest = {
  id: string
  assignment_id: string
  status: "pending" | "approved" | "denied"
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

function getShiftHours(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number)
  const [endHour, endMinute] = end.split(":").map(Number)

  let startTotal = startHour * 60 + startMinute
  let endTotal = endHour * 60 + endMinute

  if (endTotal <= startTotal) {
    endTotal += 24 * 60
  }

  return (endTotal - startTotal) / 60
}

function getShiftStartDate(shift: Shift) {
  return new Date(`${shift.date}T${shift.start_time}`)
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
  const [dropRequests, setDropRequests] = useState<DropRequest[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [workingAssignmentId, setWorkingAssignmentId] = useState<string | null>(null)

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
      let requestData: DropRequest[] = []

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

        const ownAssignmentIds = assignmentData
          .filter((assignment) => user?.id && assignment.employee_id === user.id)
          .map((assignment) => assignment.id)

        if (ownAssignmentIds.length > 0) {
          const { data: requestsData, error: requestsError } = await supabase
            .from("drop_requests")
            .select("id, assignment_id, status")
            .in("assignment_id", ownAssignmentIds)

          if (requestsError) {
            if (mounted) {
              setError(requestsError.message)
              setLoading(false)
            }
            return
          }

          requestData = (requestsData as DropRequest[]) || []
        }
      }

      if (!mounted) return

      if (shiftError || memberError) {
        setError(shiftError?.message || memberError?.message || "Unable to load schedule.")
      } else {
        setPeriod((periodData as PeriodRecord) || null)
        setShifts((shiftData as Shift[]) || [])
        setAssignments(assignmentData)
        setMembers((memberData as Member[]) || [])
        setDropRequests(requestData)
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

  const dropRequestsByAssignmentId = useMemo(() => {
    const map = new Map<string, DropRequest>()

    for (const request of dropRequests) {
      map.set(request.assignment_id, request)
    }

    return map
  }, [dropRequests])

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

  const myAssignments = useMemo(
    () => assignments.filter((assignment) => currentUserId && assignment.employee_id === currentUserId),
    [assignments, currentUserId]
  )

  const myShiftCount = myAssignments.length

  const myExpectedHours = useMemo(
    () =>
      myAssignments.reduce((total, assignment) => {
        const shift = shifts.find((item) => item.id === assignment.shift_id)
        if (!shift) return total
        return total + getShiftHours(shift.start_time, shift.end_time)
      }, 0),
    [myAssignments, shifts]
  )

  const myUpcomingShift = useMemo(() => {
    const nextShift = myAssignments
      .map((assignment) => shifts.find((shift) => shift.id === assignment.shift_id))
      .filter(Boolean)
      .filter((shift): shift is Shift => Boolean(shift))
      .filter((shift) => getShiftStartDate(shift).getTime() >= Date.now())
      .sort((a, b) => getShiftStartDate(a).getTime() - getShiftStartDate(b).getTime())[0]

    return nextShift || null
  }, [myAssignments, shifts])

  const getDisplayName = (assignment: Assignment) => {
    const member = members.find((item) => item.user_id === assignment.employee_id)
    return member?.display_name || assignment.manual_name || "Assigned"
  }

  async function handleDropShift(assignment: Assignment) {
    if (!currentUserId) {
      alert("Unable to identify your account right now.")
      return
    }

    const existingRequest = dropRequestsByAssignmentId.get(assignment.id)
    if (existingRequest?.status === "pending") {
      alert("You already have a pending drop request for this shift.")
      return
    }

    const reason = window.prompt("Add an optional reason for dropping this shift:", "")

    if (reason === null) {
      return
    }

    setWorkingAssignmentId(assignment.id)

    const { data: existingPending } = await supabase
      .from("drop_requests")
      .select("id, status")
      .eq("assignment_id", assignment.id)
      .eq("status", "pending")
      .maybeSingle()

    if (existingPending) {
      setWorkingAssignmentId(null)
      alert("A drop request for this shift is already pending.")
      return
    }

    const { error: insertError } = await supabase.from("drop_requests").insert({
      assignment_id: assignment.id,
      requested_by: currentUserId,
      reason: reason.trim() || null,
      status: "pending",
    })

    setWorkingAssignmentId(null)

    if (insertError) {
      alert(insertError.message)
      return
    }

    setDropRequests((current) => [
      ...current.filter((request) => request.assignment_id !== assignment.id),
      {
        id: `temp-${assignment.id}`,
        assignment_id: assignment.id,
        status: "pending",
      },
    ])

    alert("Your drop request was sent to the manager.")
  }

  const renderShiftCard = (shift: Shift) => {
    const shiftAssignments = assignmentsByShift.get(shift.id) || []

    return (
      <div
        key={shift.id}
        className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex">
          <div
            className="w-1.5 shrink-0"
            style={{ backgroundColor: shift.color || "#2563EB" }}
          />
          <div className="min-w-0 flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">{shift.label}</p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {formatRange(shift.start_time, shift.end_time)}
                </p>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {shiftAssignments.length} assigned
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {shiftAssignments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                  No one assigned yet
                </div>
              ) : (
                shiftAssignments.map((assignment) => {
                  const mine = Boolean(currentUserId && assignment.employee_id === currentUserId)
                  const dropRequest = dropRequestsByAssignmentId.get(assignment.id)
                  const canDrop = mine && assignment.status !== "dropped"

                  return (
                    <div
                      key={assignment.id}
                      className={`rounded-2xl px-3 py-3 text-sm ${
                        mine
                          ? "bg-blue-600 text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block truncate font-medium">{getDisplayName(assignment)}</span>
                        </div>
                        {mine ? (
                          <span className="shrink-0 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]">
                            You
                          </span>
                        ) : null}
                      </div>

                      {canDrop ? (
                        <div className="mt-3 rounded-2xl bg-white/10 p-3">
                          <div className="mb-2 text-xs font-medium text-white/85">
                            {dropRequest?.status === "pending"
                              ? "Drop request pending"
                              : "Need to drop this shift?"}
                          </div>
                          <Button
                            size="sm"
                            variant={dropRequest?.status === "pending" ? "secondary" : "outline"}
                            className={`min-h-[44px] w-full rounded-xl border-0 ${
                              dropRequest?.status === "pending"
                                ? "bg-white text-slate-900 hover:bg-white"
                                : "bg-white text-slate-900 hover:bg-slate-100"
                            }`}
                            disabled={Boolean(dropRequest?.status === "pending") || workingAssignmentId === assignment.id}
                            onClick={() => void handleDropShift(assignment)}
                          >
                            {workingAssignmentId === assignment.id
                              ? "Sending..."
                              : dropRequest?.status === "pending"
                                ? "Pending"
                                : "Drop Shift"}
                          </Button>
                        </div>
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
  }

  return (
    <PageShell title={period?.name || "My Schedule"} subtitle="Published team schedule">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <SectionCard className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-700 text-white md:col-span-2 xl:col-span-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">Next Shift</p>
          {myUpcomingShift ? (
            <div className="mt-4 space-y-3">
              <h2 className="text-2xl font-semibold tracking-tight">{myUpcomingShift.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/10 p-3">
                  <div className="flex items-center gap-2 text-blue-100/80">
                    <CalendarDays className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Day</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{formatDayLabel(myUpcomingShift.date).long}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-3">
                  <div className="flex items-center gap-2 text-blue-100/80">
                    <Clock3 className="h-4 w-4" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Time</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">
                    {formatRange(myUpcomingShift.start_time, myUpcomingShift.end_time)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-blue-50/90">
              You do not have an upcoming assigned shift in this period.
            </p>
          )}
        </SectionCard>

        <SectionCard className="bg-gradient-to-br from-blue-50 via-white to-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Shift Amount</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{myShiftCount}</h2>
            <p className="text-sm text-slate-500">scheduled this period</p>
          </div>
        </SectionCard>

        <SectionCard className="bg-gradient-to-br from-emerald-50 via-white to-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Expected Hours</p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{myExpectedHours.toFixed(1)}</h2>
            <p className="text-sm text-slate-500">hours in this schedule</p>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : loading ? (
          <p className="text-sm text-slate-500">Loading schedule...</p>
        ) : weekDays.length === 0 ? (
          <p className="text-sm text-slate-500">No shifts were found for this published period.</p>
        ) : (
          <>
            <div className="hidden xl:block">
              <div className="overflow-x-auto pb-2">
                <div className="grid min-w-[1180px] grid-cols-7 gap-4">
                  {weekDays.map((day) => {
                    const labels = formatDayLabel(day)
                    const dayShifts = shiftsByDate.get(day) || []

                    return (
                      <div
                        key={day}
                        className="flex min-h-[420px] min-w-0 flex-col rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 shadow-sm"
                      >
                        <div className="mb-4 rounded-[22px] border border-slate-200 bg-white px-4 py-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                            {labels.short}
                          </p>
                          <h3 className="text-base font-semibold text-slate-900">{labels.long}</h3>
                        </div>

                        <div className="space-y-3">
                          {dayShifts.length === 0 ? (
                            <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                              No shifts
                            </div>
                          ) : (
                            dayShifts.map((shift) => renderShiftCard(shift))
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 xl:hidden">
              {weekDays.map((day) => {
                const labels = formatDayLabel(day)
                const dayShifts = shiftsByDate.get(day) || []

                return (
                  <div
                    key={day}
                    className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="mb-4 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {labels.short}
                      </p>
                      <h3 className="text-base font-semibold text-slate-900">{labels.long}</h3>
                    </div>

                    <div className="space-y-3">
                      {dayShifts.length === 0 ? (
                        <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
                          No shifts
                        </div>
                      ) : (
                        dayShifts.map((shift) => renderShiftCard(shift))
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
