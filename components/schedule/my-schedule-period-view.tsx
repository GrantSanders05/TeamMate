"use client"

import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { openSchedulePrintWindow } from "@/lib/schedule/print-export"
import { formatDateReadable, formatTimeRange } from "@/lib/schedule/time-format"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

type Shift = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
  required_workers: number
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
  id: string
  user_id: string
  display_name: string
  role: string
  is_active: boolean
}

type AssignedPerson = {
  id: string
  name: string
  isCurrentUser: boolean
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatWeekday(dateString: string) {
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

function calculateShiftHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(":").map(Number)
  const [endHour, endMinute] = endTime.split(":").map(Number)

  let startTotal = startHour * 60 + startMinute
  let endTotal = endHour * 60 + endMinute

  if (endTotal <= startTotal) {
    endTotal += 24 * 60
  }

  return (endTotal - startTotal) / 60
}

export function MySchedulePeriodView({ periodId }: { periodId: string }) {
  const supabase = createClient()
  const { organization, member, isLoading } = useOrgSafe()

  const [period, setPeriod] = useState<Period | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [loading, setLoading] = useState(true)
  const [submittingShiftId, setSubmittingShiftId] = useState<string | null>(null)

  async function loadData() {
    if (!organization || !member) {
      setLoading(false)
      return
    }

    setLoading(true)

    const [{ data: periodData }, { data: memberData }, { data: shiftData }] = await Promise.all([
      supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("id", periodId)
        .eq("organization_id", organization.id)
        .single(),
      supabase
        .from("organization_members")
        .select("id, user_id, display_name, role, is_active")
        .eq("organization_id", organization.id)
        .eq("is_active", true)
        .order("display_name"),
      supabase
        .from("shifts")
        .select("id, date, label, start_time, end_time, required_workers, color")
        .eq("scheduling_period_id", periodId)
        .order("date", { ascending: true })
        .order("start_time", { ascending: true }),
    ])

    const normalizedPeriod = (periodData as Period) || null
    const normalizedMembers = (memberData as Member[]) || []
    const normalizedShifts = (shiftData as Shift[]) || []

    setPeriod(normalizedPeriod)
    setMembers(normalizedMembers)
    setShifts(normalizedShifts)

    const shiftIds = normalizedShifts.map((shift) => shift.id)

    if (normalizedPeriod?.status === "published" && shiftIds.length > 0) {
      const { data: assignmentData } = await supabase
        .from("shift_assignments")
        .select("id, shift_id, employee_id, manual_name, status")
        .in("shift_id", shiftIds)

      setAssignments((assignmentData as Assignment[]) || [])
    } else {
      setAssignments([])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [organization?.id, member?.user_id, periodId])

  const groupedAssignments = useMemo(
    () =>
      assignments.reduce<Record<string, Assignment[]>>((accumulator, assignment) => {
        ;(accumulator[assignment.shift_id] ||= []).push(assignment)
        return accumulator
      }, {}),
    [assignments]
  )

  const shiftsByDate = useMemo(
    () =>
      shifts.reduce<Record<string, Shift[]>>((accumulator, shift) => {
        ;(accumulator[shift.date] ||= []).push(shift)
        return accumulator
      }, {}),
    [shifts]
  )

  const calendarDates = useMemo(() => {
    if (!period) return []
    return getDatesInRange(period.start_date, period.end_date)
  }, [period])

  const myAssignedShiftIds = useMemo(() => {
    if (!member?.user_id) return new Set<string>()

    return new Set(
      assignments
        .filter(
          (assignment) =>
            assignment.employee_id === member.user_id && assignment.status === "assigned"
        )
        .map((assignment) => assignment.shift_id)
    )
  }, [assignments, member?.user_id])

  const myShiftCount = useMemo(() => myAssignedShiftIds.size, [myAssignedShiftIds])

  const myHours = useMemo(
    () =>
      shifts
        .filter((shift) => myAssignedShiftIds.has(shift.id))
        .reduce(
          (total, shift) => total + calculateShiftHours(shift.start_time, shift.end_time),
          0
        ),
    [shifts, myAssignedShiftIds]
  )

  const upcomingMine = useMemo(
    () =>
      shifts
        .filter((shift) => myAssignedShiftIds.has(shift.id))
        .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`))
        .slice(0, 3),
    [shifts, myAssignedShiftIds]
  )

  function getAssignedNames(shiftId: string): AssignedPerson[] {
    const assigned = (groupedAssignments[shiftId] || []).filter(
      (assignment) => assignment.status === "assigned"
    )

    return assigned.map((assignment) => {
      const assignedMember = members.find((item) => item.user_id === assignment.employee_id)

      return {
        id: assignment.id,
        name: assignedMember?.display_name || assignment.manual_name || "Assigned",
        isCurrentUser: assignment.employee_id === member?.user_id,
      }
    })
  }

  async function requestDrop(shiftId: string) {
    if (!member?.user_id) return

    const assigned = (groupedAssignments[shiftId] || []).find(
      (assignment) =>
        assignment.employee_id === member.user_id && assignment.status === "assigned"
    )

    if (!assigned) {
      alert("You are not assigned to this shift.")
      return
    }

    setSubmittingShiftId(shiftId)

    const { data: existingRequest } = await supabase
      .from("drop_requests")
      .select("id, status")
      .eq("assignment_id", assigned.id)
      .maybeSingle()

    if (existingRequest && existingRequest.status === "pending") {
      setSubmittingShiftId(null)
      alert("You already have a pending drop request for this shift.")
      return
    }

    const { error } = await supabase.from("drop_requests").insert({
      assignment_id: assigned.id,
      requested_by: member.user_id,
      status: "pending",
      reason: null,
    })

    setSubmittingShiftId(null)

    if (error) {
      alert(error.message)
      return
    }

    alert("Drop request submitted.")
  }

  function exportSchedule() {
    if (!period || !organization) return

    openSchedulePrintWindow({
      title: `${organization.name} — ${period.name}`,
      subtitle: `${formatDateReadable(period.start_date)} – ${formatDateReadable(
        period.end_date
      )} · Published Team Schedule`,
      shifts,
      assignments,
      members: members.map((m) => ({
        id: m.id,
        user_id: m.user_id,
        display_name: m.display_name,
      })),
      startDate: period.start_date,
      endDate: period.end_date,
    })
  }

  function renderShiftCard(shift: Shift, compact = false) {
    const assignedPeople = getAssignedNames(shift.id)
    const currentUserAssigned = assignedPeople.some((person) => person.isCurrentUser)

    return (
      <div
        key={shift.id}
        className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
          compact ? "p-3 pl-4" : "p-4 pl-5"
        }`}
      >
        <div
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: shift.color || "#2563EB" }}
        />

        <div className="min-w-0">
          <div className={`truncate font-semibold text-slate-900 ${compact ? "text-sm" : "text-base"}`}>
            {shift.label}
          </div>
          <div
            className={`mt-1 whitespace-nowrap text-slate-500 ${
              compact ? "text-xs font-medium" : "text-sm font-medium"
            }`}
          >
            {formatTimeRange(shift.start_time, shift.end_time)}
          </div>
        </div>

        {currentUserAssigned ? (
          <div className="mt-2 inline-flex rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-700">
            My shift
          </div>
        ) : null}

        <div className={`mt-3 space-y-2 ${compact ? "" : ""}`}>
          {assignedPeople.length === 0 ? (
            <div className={`text-slate-400 ${compact ? "text-xs" : "text-sm"}`}>No one assigned yet</div>
          ) : (
            assignedPeople.map((person) => (
              <div
                key={person.id}
                className={`truncate rounded-full bg-slate-100 text-slate-700 ${
                  compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
                } ${person.isCurrentUser ? "ring-1 ring-blue-200 bg-blue-50 text-blue-700" : ""}`}
              >
                {person.name}
              </div>
            ))
          )}
        </div>

        {period?.status === "published" && currentUserAssigned ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size={compact ? "sm" : "default"}
              className="w-full rounded-xl"
              onClick={() => void requestDrop(shift.id)}
              disabled={submittingShiftId === shift.id}
            >
              {submittingShiftId === shift.id ? "Requesting..." : "Request Drop"}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  if (isLoading || loading) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Loading schedule...</div>
  }

  if (!organization || !member) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">No active organization selected.</div>
  }

  if (!period) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Published schedule not found.</div>
  }

  if (period.status !== "published") {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">
        This schedule period has not been published yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">{period.name}</h1>
            <p className="text-sm text-slate-500">
              {formatDateReadable(period.start_date)} – {formatDateReadable(period.end_date)} · Published Team Schedule
            </p>
            <p className="text-sm text-slate-500">
              See the full team schedule and who you are working with.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              Calendar
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
            <Button type="button" variant="outline" onClick={exportSchedule}>
              Export
            </Button>
          </div>
        </div>
      </section>

      {viewMode === "calendar" ? (
        <>
          <section className="rounded-2xl border bg-white p-4 shadow-sm md:hidden">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Schedule by Day</h2>
              <p className="text-sm text-slate-500">Mobile day-by-day view for quick scrolling.</p>
            </div>

            <div className="space-y-4">
              {calendarDates.map((date) => (
                <div key={date} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatWeekday(date)}
                    </div>
                    <div className="text-base font-semibold text-slate-900">{formatDateReadable(date)}</div>
                  </div>

                  <div className="space-y-3">
                    {(shiftsByDate[date] || []).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-center text-sm text-slate-400">
                        No shifts
                      </div>
                    ) : (
                      (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="hidden rounded-2xl border bg-white p-4 shadow-sm md:block">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Weekly Calendar View</h2>
                <p className="text-sm text-slate-500">
                  Employees can see the full published team schedule and who is assigned to each shift.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="grid min-w-[1120px] grid-cols-7 gap-3">
                {calendarDates.map((date) => (
                  <div key={date} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                    <div className="mb-3 min-w-0">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {formatWeekday(date)}
                      </div>
                      <div className="truncate text-base font-semibold text-slate-900">
                        {formatDateReadable(date)}
                      </div>
                    </div>

                    <div className="space-y-2.5">
                      {(shiftsByDate[date] || []).length === 0 ? (
                        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-3 py-4 text-center text-sm text-slate-400">
                          No shifts
                        </div>
                      ) : (
                        (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift, true))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">List View</h2>
          </div>

          {shifts.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">
              No published shifts in this period yet.
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((shift) => renderShiftCard(shift))}
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shifts</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{myShiftCount}</div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hours</div>
          <div className="mt-2 text-3xl font-semibold text-slate-900">{myHours.toFixed(1)}</div>
          <p className="mt-2 text-sm text-slate-500">Expected total this period: {myHours.toFixed(1)} hours</p>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm md:col-span-2 xl:col-span-2">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Coming Up</h2>
            <p className="text-sm text-slate-500">Your next assigned shifts in this period.</p>
          </div>

          {upcomingMine.length === 0 ? (
            <div className="text-sm text-slate-500">No assigned shifts yet.</div>
          ) : (
            <div className="space-y-3">
              {upcomingMine.map((shift) => (
                <div key={shift.id} className="rounded-xl border border-slate-200 p-3">
                  <div className="font-medium text-slate-900">{shift.label}</div>
                  <div className="mt-1 text-sm text-slate-500">{formatDateReadable(shift.date)}</div>
                  <div className="text-sm text-slate-500">{formatTimeRange(shift.start_time, shift.end_time)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
