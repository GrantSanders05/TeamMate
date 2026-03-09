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

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

function formatWeekday(dateString: string) {
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

  const groupedAssignments = useMemo(() => {
    return assignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
      if (!acc[assignment.shift_id]) acc[assignment.shift_id] = []
      acc[assignment.shift_id].push(assignment)
      return acc
    }, {})
  }, [assignments])

  const shiftsByDate = useMemo(() => {
    return shifts.reduce<Record<string, Shift[]>>((acc, shift) => {
      if (!acc[shift.date]) acc[shift.date] = []
      acc[shift.date].push(shift)
      return acc
    }, {})
  }, [shifts])

  const calendarDates = useMemo(() => {
    if (!period) return []
    return getDatesInRange(period.start_date, period.end_date)
  }, [period])

  const myAssignedShiftIds = useMemo(() => {
    if (!member?.user_id) return new Set<string>()
    return new Set(
      assignments
        .filter(
          (assignment) => assignment.employee_id === member.user_id && assignment.status === "assigned"
        )
        .map((assignment) => assignment.shift_id)
    )
  }, [assignments, member?.user_id])

  const myShiftCount = useMemo(() => {
    return myAssignedShiftIds.size
  }, [myAssignedShiftIds])

  const myHours = useMemo(() => {
    return shifts
      .filter((shift) => myAssignedShiftIds.has(shift.id))
      .reduce((total, shift) => total + calculateShiftHours(shift.start_time, shift.end_time), 0)
  }, [shifts, myAssignedShiftIds])

  function getAssignedNames(shiftId: string) {
    const assigned = groupedAssignments[shiftId] || []
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
      (assignment) => assignment.employee_id === member.user_id && assignment.status === "assigned"
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
      subtitle: `${formatDateReadable(period.start_date)} – ${formatDateReadable(period.end_date)} · Published Team Schedule`,
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

  function renderShiftCard(shift: Shift) {
    const assignedPeople = getAssignedNames(shift.id)
    const currentUserAssigned = assignedPeople.some((person) => person.isCurrentUser)

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
        <div className="mt-1 text-xs text-slate-500">
          {assignedPeople.length}/{shift.required_workers} assigned
        </div>

        <div className="mt-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Working This Shift
          </div>

          <div className="flex flex-wrap gap-2">
            {assignedPeople.length === 0 ? (
              <span className="text-xs text-slate-500">No one assigned.</span>
            ) : (
              assignedPeople.map((person) => (
                <span
                  key={person.id}
                  className={
                    person.isCurrentUser
                      ? "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                      : "rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                  }
                >
                  {person.name}
                </span>
              ))
            )}
          </div>
        </div>

        {period?.status === "published" && currentUserAssigned ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={submittingShiftId === shift.id}
              onClick={() => void requestDrop(shift.id)}
            >
              {submittingShiftId === shift.id ? "Requesting..." : "Request Drop"}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  if (isLoading || loading) {
    return <div className="rounded-lg border bg-white p-6">Loading schedule...</div>
  }

  if (!organization || !member) {
    return <div className="rounded-lg border bg-white p-6">No active organization selected.</div>
  }

  if (!period) {
    return <div className="rounded-lg border bg-white p-6">Published schedule not found.</div>
  }

  if (period.status !== "published") {
    return (
      <div className="rounded-lg border bg-white p-6">
        This schedule period has not been published yet.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{period.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDateReadable(period.start_date)} – {formatDateReadable(period.end_date)} · Published Team Schedule
            </p>
            <p className="mt-2 text-sm text-slate-600">
              This shows the full team schedule, including who you are working with on each shift.
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
            <Button type="button" variant="outline" onClick={exportSchedule}>
              Export / Print
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {viewMode === "calendar" ? (
            <div className="rounded-lg border bg-white p-6">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Weekly Calendar View</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Employees can see the full published team schedule and who is assigned to each shift.
                </p>
              </div>

              <div className="overflow-x-auto">
                <div className="grid min-w-[1100px] grid-cols-7 gap-4">
                  {calendarDates.map((date) => (
                    <div key={date} className="rounded-lg border bg-slate-50 p-3">
                      <div className="border-b pb-2">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatWeekday(date)}
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
              <h2 className="text-lg font-semibold">List View</h2>

              {shifts.length === 0 ? (
                <div className="mt-4 text-sm text-slate-600">
                  No published shifts in this period yet.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {shifts.map((shift) => renderShiftCard(shift))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside>
          <div className="sticky top-4 rounded-lg border bg-white p-5">
            <h2 className="text-lg font-semibold">My Hours</h2>
            <p className="mt-1 text-sm text-slate-600">
              Your assigned hours and shifts for this published period.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Shifts</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {myShiftCount}
                </div>
              </div>

              <div className="rounded-md bg-slate-50 p-3">
                <div className="text-[11px] uppercase tracking-wide text-slate-500">Hours</div>
                <div className="mt-1 text-2xl font-semibold text-slate-900">
                  {myHours.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              Expected total for this period: <span className="font-semibold">{myHours.toFixed(1)} hours</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
