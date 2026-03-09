"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Pencil, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { openSchedulePrintWindow } from "@/lib/schedule/print-export"
import { formatDateReadable, formatTimeRange } from "@/lib/schedule/time-format"
import { computeEmployeeLoads } from "@/lib/scheduling/recommendations"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  period_type: string
  availability_link_token?: string | null
}

type ShiftType = {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
  required_workers: number
  is_active?: boolean
}

type Member = {
  id: string
  user_id: string
  display_name: string
  role: string
  is_active: boolean
}

type Shift = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
  required_workers: number
  shift_type_id: string | null
  color?: string | null
}

type Assignment = {
  id: string
  shift_id: string
  employee_id: string | null
  manual_name: string | null
  status: string
}

type AvailabilityResponse = {
  shift_id: string
  employee_id: string
  status: "available" | "unavailable" | "all_day"
  notes: string | null
}

type AvailabilitySummary = {
  available: Member[]
  unavailable: Member[]
  noResponse: Member[]
  availableCount: number
  unavailableCount: number
  noResponseCount: number
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const formatWeekday = (dateString: string) =>
  weekdayLabels[new Date(`${dateString}T00:00:00`).getDay()]

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

export function SchedulePeriodBuilder({ periodId }: { periodId: string }) {
  const supabase = createClient()
  const { organization, member, isManager } = useOrgSafe()

  const [period, setPeriod] = useState<Period | null>(null)
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [availabilityResponses, setAvailabilityResponses] = useState<
    AvailabilityResponse[]
  >([])

  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")

  const [newShiftDate, setNewShiftDate] = useState("")
  const [newShiftTypeId, setNewShiftTypeId] = useState("")
  const [newShiftLabel, setNewShiftLabel] = useState("")
  const [newShiftStart, setNewShiftStart] = useState("")
  const [newShiftEnd, setNewShiftEnd] = useState("")
  const [newShiftRequiredWorkers, setNewShiftRequiredWorkers] = useState("1")
  const [newShiftColor, setNewShiftColor] = useState("#2563EB")
  const [selectedBulkDates, setSelectedBulkDates] = useState<string[]>([])
  const [manualNames, setManualNames] = useState<Record<string, string>>({})

  const [editingShiftId, setEditingShiftId] = useState<string | null>(null)
  const [editShiftDate, setEditShiftDate] = useState("")
  const [editShiftLabel, setEditShiftLabel] = useState("")
  const [editShiftStart, setEditShiftStart] = useState("")
  const [editShiftEnd, setEditShiftEnd] = useState("")
  const [editShiftRequiredWorkers, setEditShiftRequiredWorkers] = useState("1")
  const [editShiftColor, setEditShiftColor] = useState("#2563EB")

  async function loadData() {
    if (!organization) {
      setLoading(false)
      return
    }

    setLoading(true)

    const [{ data: periodData }, { data: shiftTypeData }, { data: memberData }, { data: shiftData }] =
      await Promise.all([
        supabase
          .from("scheduling_periods")
          .select(
            "id, name, start_date, end_date, status, period_type, availability_link_token"
          )
          .eq("id", periodId)
          .single(),
        supabase
          .from("shift_types")
          .select("id, name, start_time, end_time, color, required_workers, is_active")
          .eq("organization_id", organization.id)
          .order("name"),
        supabase
          .from("organization_members")
          .select("id, user_id, display_name, role, is_active")
          .eq("organization_id", organization.id)
          .eq("is_active", true)
          .order("display_name"),
        supabase
          .from("shifts")
          .select(
            "id, date, label, start_time, end_time, required_workers, shift_type_id, color"
          )
          .eq("scheduling_period_id", periodId)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
      ])

    const normalizedShifts = ((shiftData as Shift[]) || []).filter(Boolean)

    setPeriod((periodData as Period) || null)
    setShiftTypes(
      (((shiftTypeData as ShiftType[]) || []).filter((item) => item.is_active !== false))
    )
    setMembers(
      (((memberData as Member[]) || []).filter(
        (item) => item.role === "employee" || item.role === "manager"
      ))
    )
    setShifts(normalizedShifts)

    await refreshShiftState(normalizedShifts.map((shift) => shift.id))
    setLoading(false)
  }

  async function refreshShiftState(shiftIds: string[]) {
    if (shiftIds.length === 0) {
      setAssignments([])
      setAvailabilityResponses([])
      return
    }

    const [{ data: assignmentData }, { data: availabilityData }] = await Promise.all([
      supabase
        .from("shift_assignments")
        .select("id, shift_id, employee_id, manual_name, status")
        .in("shift_id", shiftIds),
      supabase
        .from("availability_responses")
        .select("shift_id, employee_id, status, notes")
        .in("shift_id", shiftIds),
    ])

    setAssignments((assignmentData as Assignment[]) || [])
    setAvailabilityResponses((availabilityData as AvailabilityResponse[]) || [])
  }

  useEffect(() => {
    void loadData()
  }, [organization?.id, periodId])

  const groupedAssignments = useMemo(
    () =>
      assignments.reduce<Record<string, Assignment[]>>((accumulator, assignment) => {
        ;(accumulator[assignment.shift_id] ||= []).push(assignment)
        return accumulator
      }, {}),
    [assignments]
  )

  const availabilityByShift = useMemo(() => {
    const map: Record<string, AvailabilitySummary> = {}

    for (const shift of shifts) {
      const responses = availabilityResponses.filter((item) => item.shift_id === shift.id)

      const availableIds = new Set(
        responses
          .filter((item) => item.status === "available" || item.status === "all_day")
          .map((item) => item.employee_id)
      )

      const unavailableIds = new Set(
        responses
          .filter((item) => item.status === "unavailable")
          .map((item) => item.employee_id)
      )

      const available = members.filter((item) => availableIds.has(item.user_id))
      const unavailable = members.filter((item) => unavailableIds.has(item.user_id))
      const noResponse = members.filter(
        (item) => !availableIds.has(item.user_id) && !unavailableIds.has(item.user_id)
      )

      map[shift.id] = {
        available,
        unavailable,
        noResponse,
        availableCount: available.length,
        unavailableCount: unavailable.length,
        noResponseCount: noResponse.length,
      }
    }

    return map
  }, [availabilityResponses, members, shifts])

  const shiftsByDate = useMemo(
    () =>
      shifts.reduce<Record<string, Shift[]>>((accumulator, shift) => {
        ;(accumulator[shift.date] ||= []).push(shift)
        return accumulator
      }, {}),
    [shifts]
  )

  const calendarDates = useMemo(
    () => (period ? getDatesInRange(period.start_date, period.end_date) : []),
    [period]
  )

  const employeeLoads = useMemo(
    () =>
      computeEmployeeLoads(
        members.map((person) => ({
          user_id: person.user_id,
          display_name: person.display_name,
        })),
        shifts.map((shift) => ({
          id: shift.id,
          date: shift.date,
          start_time: shift.start_time,
          end_time: shift.end_time,
          required_workers: shift.required_workers,
        })),
        assignments.map((assignment) => ({
          shift_id: assignment.shift_id,
          employee_id: assignment.employee_id,
          status: assignment.status,
        }))
      ),
    [members, shifts, assignments]
  )

  function fillFromShiftType(id: string) {
    setNewShiftTypeId(id)
    const match = shiftTypes.find((shiftType) => shiftType.id === id)
    if (!match) return

    setNewShiftLabel(match.name)
    setNewShiftStart(match.start_time)
    setNewShiftEnd(match.end_time)
    setNewShiftRequiredWorkers(String(match.required_workers || 1))
    setNewShiftColor(match.color || "#2563EB")
  }

  function resetShiftForm() {
    setNewShiftDate("")
    setNewShiftTypeId("")
    setNewShiftLabel("")
    setNewShiftStart("")
    setNewShiftEnd("")
    setNewShiftRequiredWorkers("1")
    setNewShiftColor("#2563EB")
    setSelectedBulkDates([])
  }

  function startEditingShift(shift: Shift) {
    setEditingShiftId(shift.id)
    setEditShiftDate(shift.date)
    setEditShiftLabel(shift.label)
    setEditShiftStart(shift.start_time)
    setEditShiftEnd(shift.end_time)
    setEditShiftRequiredWorkers(String(shift.required_workers || 1))
    setEditShiftColor(shift.color || "#2563EB")
  }

  function cancelEditingShift() {
    setEditingShiftId(null)
    setEditShiftDate("")
    setEditShiftLabel("")
    setEditShiftStart("")
    setEditShiftEnd("")
    setEditShiftRequiredWorkers("1")
    setEditShiftColor("#2563EB")
  }

  function toggleBulkDate(date: string) {
    setSelectedBulkDates((current) =>
      current.includes(date)
        ? current.filter((item) => item !== date)
        : [...current, date]
    )
  }

  async function createSingleShift(event: FormEvent) {
    event.preventDefault()
    if (!periodId) return

    const template = shiftTypes.find((item) => item.id === newShiftTypeId)

    const { error } = await supabase.from("shifts").insert({
      scheduling_period_id: periodId,
      shift_type_id: newShiftTypeId || null,
      date: newShiftDate,
      label: newShiftLabel,
      start_time: newShiftStart,
      end_time: newShiftEnd,
      required_workers: Number(newShiftRequiredWorkers || "1"),
      color: template?.color || newShiftColor || "#2563EB",
    })

    if (error) {
      alert(error.message)
      return
    }

    resetShiftForm()
    await loadData()
  }

  async function createBulkShifts() {
    if (!periodId || selectedBulkDates.length === 0) {
      alert("Choose at least one date for bulk creation.")
      return
    }

    const template = shiftTypes.find((item) => item.id === newShiftTypeId)
    const existing = new Set(
      shifts.map((shift) => `${shift.date}|${shift.label}|${shift.start_time}|${shift.end_time}`)
    )

    const rows = selectedBulkDates
      .filter((date) => !existing.has(`${date}|${newShiftLabel}|${newShiftStart}|${newShiftEnd}`))
      .map((date) => ({
        scheduling_period_id: periodId,
        shift_type_id: newShiftTypeId || null,
        date,
        label: newShiftLabel,
        start_time: newShiftStart,
        end_time: newShiftEnd,
        required_workers: Number(newShiftRequiredWorkers || "1"),
        color: template?.color || newShiftColor || "#2563EB",
      }))

    if (rows.length === 0) {
      alert("All selected dates already have this same shift.")
      return
    }

    const { error } = await supabase.from("shifts").insert(rows)

    if (error) {
      alert(error.message)
      return
    }

    resetShiftForm()
    await loadData()
  }

  async function saveShiftEdits(event: FormEvent) {
    event.preventDefault()
    if (!editingShiftId) return

    const payload = {
      date: editShiftDate,
      label: editShiftLabel,
      start_time: editShiftStart,
      end_time: editShiftEnd,
      required_workers: Number(editShiftRequiredWorkers || "1"),
      color: editShiftColor || "#2563EB",
    }

    const { error } = await supabase.from("shifts").update(payload).eq("id", editingShiftId)

    if (error) {
      alert(error.message)
      return
    }

    setShifts((current) =>
      current.map((shift) => (shift.id === editingShiftId ? { ...shift, ...payload } : shift))
    )
    cancelEditingShift()
  }

  async function deleteShift(shiftId: string) {
    const shift = shifts.find((item) => item.id === shiftId)
    if (!shift) return

    if (!window.confirm(`Delete ${shift.label} on ${formatDateReadable(shift.date)}?`)) return

    const { error } = await supabase.from("shifts").delete().eq("id", shiftId)

    if (error) {
      alert(error.message)
      return
    }

    setShifts((current) => current.filter((shift) => shift.id !== shiftId))
    setAssignments((current) => current.filter((assignment) => assignment.shift_id !== shiftId))
    setAvailabilityResponses((current) =>
      current.filter((response) => response.shift_id !== shiftId)
    )

    if (editingShiftId === shiftId) cancelEditingShift()
  }

  async function assignMember(shiftId: string, employeeId: string) {
    if (!member?.user_id) return

    const allowed = new Set(
      (availabilityByShift[shiftId]?.available || []).map((person) => person.user_id)
    )

    if (!allowed.has(employeeId)) {
      alert("Only employees who marked themselves available can be assigned to this shift.")
      return
    }

    if (
      (groupedAssignments[shiftId] || []).some(
        (assignment) =>
          assignment.employee_id === employeeId && assignment.status === "assigned"
      )
    ) {
      alert("That employee is already assigned to this shift.")
      return
    }

    const { data, error } = await supabase
      .from("shift_assignments")
      .insert({
        shift_id: shiftId,
        employee_id: employeeId,
        assigned_by: member.user_id,
        status: "assigned",
      })
      .select("id, shift_id, employee_id, manual_name, status")
      .single()

    if (error) {
      alert(error.message)
      return
    }

    if (data) {
      setAssignments((current) => [...current, data as Assignment])
    }
  }

  async function assignManualName(shiftId: string) {
    if (!member?.user_id) return

    const name = (manualNames[shiftId] || "").trim()
    if (!name) {
      alert("Enter a name first.")
      return
    }

    const { data, error } = await supabase
      .from("shift_assignments")
      .insert({
        shift_id: shiftId,
        manual_name: name,
        assigned_by: member.user_id,
        status: "assigned",
      })
      .select("id, shift_id, employee_id, manual_name, status")
      .single()

    if (error) {
      alert(error.message)
      return
    }

    setManualNames((current) => ({ ...current, [shiftId]: "" }))

    if (data) {
      setAssignments((current) => [...current, data as Assignment])
    }
  }

  async function unassignMember(assignmentId: string) {
    const { error } = await supabase.from("shift_assignments").delete().eq("id", assignmentId)

    if (error) {
      alert(error.message)
      return
    }

    setAssignments((current) => current.filter((assignment) => assignment.id !== assignmentId))
  }

  async function updateStatus(nextStatus: "collecting" | "scheduling" | "published") {
    if (!period) return

    const payload: Record<string, string | null> = {
      status: nextStatus,
      published_at: nextStatus === "published" ? new Date().toISOString() : null,
    }

    const { error } = await supabase.from("scheduling_periods").update(payload).eq("id", period.id)

    if (error) {
      alert(error.message)
      return
    }

    setPeriod((current) => (current ? { ...current, status: nextStatus } : current))
  }

  async function archivePeriod() {
    if (!period || !organization || !member?.user_id) return
    if (!window.confirm("Archive this period and move it to History?")) return

    const snapshot = {
      period,
      shifts,
      assignments,
      members: members.map((person) => ({
        id: person.id,
        user_id: person.user_id,
        display_name: person.display_name,
      })),
    }

    const archiveError = (
      await supabase.from("schedule_archives").insert({
        scheduling_period_id: period.id,
        organization_id: organization.id,
        snapshot_data: snapshot,
        archived_by: member.user_id,
      })
    ).error

    if (archiveError) {
      alert(archiveError.message)
      return
    }

    const periodError = (
      await supabase.from("scheduling_periods").update({ status: "archived" }).eq("id", period.id)
    ).error

    if (periodError) {
      alert(periodError.message)
      return
    }

    alert("Schedule archived.")
    setPeriod((current) => (current ? { ...current, status: "archived" } : current))
  }

  async function copyAvailabilityLink() {
    if (!period || typeof window === "undefined") return

    const url = `${window.location.origin}/availability/${period.id}?token=${
      period.availability_link_token || ""
    }`

    await navigator.clipboard.writeText(url)
    alert("Availability link copied.")
  }

  function exportSchedule() {
    if (!period || !organization) return

    openSchedulePrintWindow({
      title: `${organization.name} — ${period.name}`,
      subtitle: `${formatDateReadable(period.start_date)} – ${formatDateReadable(period.end_date)} · ${period.status}`,
      shifts,
      assignments,
      members: members.map((person) => ({
        id: person.id,
        user_id: person.user_id,
        display_name: person.display_name,
      })),
      startDate: period.start_date,
      endDate: period.end_date,
    })
  }

  function statusBadgeClass(status: string) {
    switch (status) {
      case "collecting":
        return "bg-blue-50 text-blue-700 ring-blue-200"
      case "scheduling":
        return "bg-amber-50 text-amber-700 ring-amber-200"
      case "published":
        return "bg-emerald-50 text-emerald-700 ring-emerald-200"
      case "archived":
        return "bg-slate-100 text-slate-700 ring-slate-200"
      default:
        return "bg-slate-100 text-slate-700 ring-slate-200"
    }
  }

  function renderShiftCard(shift: Shift) {
    const assigned = (groupedAssignments[shift.id] || []).filter(
      (assignment) => assignment.status !== "dropped"
    )
    const availability = availabilityByShift[shift.id]
    const availablePeople = availability?.available || []
    const assignedCount = assigned.length

    return (
      <div
        key={shift.id}
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 pl-4 shadow-sm"
      >
        <div
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: shift.color || "#2563EB" }}
        />

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-semibold leading-5 text-slate-900">{shift.label}</h4>
            <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-slate-500">
              {formatTimeRange(shift.start_time, shift.end_time)}
            </p>
          </div>

          {isManager && period?.status !== "published" ? (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => startEditingShift(shift)}
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label={`Edit ${shift.label}`}
                title="Edit shift"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => void deleteShift(shift.id)}
                className="rounded-full p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                aria-label={`Delete ${shift.label}`}
                title="Delete shift"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-2.5 space-y-1.5">
          {assigned.length === 0 ? (
            <div className="text-xs text-slate-400">No one assigned yet</div>
          ) : (
            assigned.map((assignment) => {
              const assignedMember = members.find(
                (item) => item.user_id === assignment.employee_id
              )
              const displayName =
                assignedMember?.display_name || assignment.manual_name || "Assigned"
              const isManual = Boolean(assignment.manual_name) && !assignment.employee_id

              return (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs"
                >
                  <span className={`truncate leading-4 ${isManual ? "italic text-slate-600" : "text-slate-700"}`}>
                    {displayName}
                  </span>
                  {isManager && period?.status !== "published" ? (
                    <button
                      type="button"
                      onClick={() => void unassignMember(assignment.id)}
                      className="shrink-0 text-slate-400 transition hover:text-red-600"
                      aria-label={`Remove ${displayName}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              )
            })
          )}
        </div>

        {isManager && period?.status !== "published" ? (
          <div className="mt-3 space-y-2.5 border-t border-slate-200 pt-3">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Assign employee
              </Label>
              <select
                defaultValue=""
                onChange={(event) => {
                  const value = event.target.value
                  if (!value) return
                  void assignMember(shift.id, value)
                  event.target.value = ""
                }}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-slate-400"
              >
                <option value="">Select available employee</option>
                {availablePeople.map((person) => (
                  <option key={person.user_id} value={person.user_id}>
                    {person.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Manual write-in
              </Label>
              <div className="flex gap-2">
                <Input
                  value={manualNames[shift.id] || ""}
                  onChange={(event) =>
                    setManualNames((current) => ({
                      ...current,
                      [shift.id]: event.target.value,
                    }))
                  }
                  placeholder="Write in name"
                  className="h-9 rounded-lg px-3 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-lg text-xs"
                  onClick={() => void assignManualName(shift.id)}
                >
                  Add
                </Button>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              {assignedCount}/{shift.required_workers} filled
            </p>
          </div>
        ) : null}
      </div>
    )
  }

  if (!organization) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Select an organization to continue.</div>
  }

  if (loading) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Loading schedule builder…</div>
  }

  if (!period) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Schedule period not found.</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{period.name}</h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(period.status)}`}
              >
                {period.status}
              </span>
            </div>
            <p className="text-sm text-slate-500">
              {formatDateReadable(period.start_date)} – {formatDateReadable(period.end_date)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setViewMode(viewMode === "calendar" ? "list" : "calendar")}>
              {viewMode === "calendar" ? "List View" : "Calendar View"}
            </Button>
            {period.status === "draft" ? (
              <Button type="button" onClick={() => void updateStatus("collecting")}>
                Open for Availability
              </Button>
            ) : null}
            {period.status === "collecting" ? (
              <Button type="button" onClick={() => void updateStatus("scheduling")}>
                Close Availability
              </Button>
            ) : null}
            {period.status === "scheduling" ? (
              <Button type="button" onClick={() => void updateStatus("published")}>
                Publish
              </Button>
            ) : null}
            {period.status === "published" ? (
              <Button type="button" variant="outline" onClick={() => void updateStatus("scheduling")}>
                Unpublish for Editing
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={copyAvailabilityLink}>
              Copy Availability Link
            </Button>
            <Button type="button" variant="outline" onClick={exportSchedule}>
              Export / Print
            </Button>
            <Button type="button" variant="outline" onClick={archivePeriod}>
              Archive
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {isManager ? (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Add Shifts</h2>
                <p className="text-sm text-slate-500">Create one shift or generate it across multiple dates.</p>
              </div>

              <form onSubmit={createSingleShift} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={newShiftDate} onChange={(event) => setNewShiftDate(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Shift type</Label>
                  <select
                    value={newShiftTypeId}
                    onChange={(event) => fillFromShiftType(event.target.value)}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="">Custom shift</option>
                    {shiftTypes.map((shiftType) => (
                      <option key={shiftType.id} value={shiftType.id}>
                        {shiftType.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Shift label</Label>
                  <Input value={newShiftLabel} onChange={(event) => setNewShiftLabel(event.target.value)} placeholder="Morning Shift" required />
                </div>
                <div className="space-y-2">
                  <Label>Required workers</Label>
                  <Input type="number" min="1" value={newShiftRequiredWorkers} onChange={(event) => setNewShiftRequiredWorkers(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Start time</Label>
                  <Input type="time" value={newShiftStart} onChange={(event) => setNewShiftStart(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Input type="time" value={newShiftEnd} onChange={(event) => setNewShiftEnd(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Shift color</Label>
                  <Input type="color" value={newShiftColor} onChange={(event) => setNewShiftColor(event.target.value)} className="h-11 w-20 rounded-xl p-1" />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full">
                    Add Shift
                  </Button>
                </div>
              </form>

              <div className="mt-6 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Bulk dates</h3>
                  <p className="text-xs text-slate-500">Select dates to create the same shift across the period.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {calendarDates.map((date) => {
                    const active = selectedBulkDates.includes(date)
                    return (
                      <button
                        key={date}
                        type="button"
                        onClick={() => toggleBulkDate(date)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {formatWeekday(date)} {new Date(`${date}T00:00:00`).getDate()}
                      </button>
                    )
                  })}
                </div>
                <Button type="button" variant="outline" onClick={() => void createBulkShifts()}>
                  Create Bulk Shifts
                </Button>
              </div>
            </section>
          ) : null}

          {editingShiftId ? (
            <section className="rounded-2xl border bg-white p-6 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-slate-900">Edit Shift</h2>
                <p className="text-sm text-slate-500">Update the selected shift without leaving the builder.</p>
              </div>

              <form onSubmit={saveShiftEdits} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={editShiftDate} onChange={(event) => setEditShiftDate(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Required workers</Label>
                  <Input type="number" min="1" value={editShiftRequiredWorkers} onChange={(event) => setEditShiftRequiredWorkers(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Shift color</Label>
                  <Input type="color" value={editShiftColor} onChange={(event) => setEditShiftColor(event.target.value)} className="h-11 w-20 rounded-xl p-1" />
                </div>
                <div className="space-y-2">
                  <Label>Shift label</Label>
                  <Input value={editShiftLabel} onChange={(event) => setEditShiftLabel(event.target.value)} placeholder="Morning Shift" required />
                </div>
                <div className="space-y-2">
                  <Label>Start time</Label>
                  <Input type="time" value={editShiftStart} onChange={(event) => setEditShiftStart(event.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>End time</Label>
                  <Input type="time" value={editShiftEnd} onChange={(event) => setEditShiftEnd(event.target.value)} required />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="submit">Save Changes</Button>
                  <Button type="button" variant="outline" onClick={cancelEditingShift}>
                    Cancel
                  </Button>
                </div>
              </form>
            </section>
          ) : null}

          {viewMode === "calendar" ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {calendarDates.map((date) => (
                <div key={date} className="min-w-0 rounded-xl border bg-slate-50/70 p-3">
                  <div className="mb-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {formatWeekday(date)}
                    </div>
                    <div className="text-sm font-semibold text-slate-900">
                      {formatDateReadable(date)}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {(shiftsByDate[date] || []).length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-center text-sm text-slate-400">
                        No shifts
                      </div>
                    ) : (
                      (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift))
                    )}
                  </div>
                </div>
              ))}
            </section>
          ) : (
            <section className="space-y-4">
              {shifts.length === 0 ? (
                <div className="rounded-2xl border bg-white p-8 text-center text-sm text-slate-500">
                  No shifts created yet.
                </div>
              ) : (
                calendarDates.map((date) => {
                  const dayShifts = shiftsByDate[date] || []
                  if (dayShifts.length === 0) return null

                  return (
                    <div key={date} className="rounded-2xl border bg-white p-4 shadow-sm">
                      <div className="mb-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {formatWeekday(date)}
                        </div>
                        <div className="text-base font-semibold text-slate-900">
                          {formatDateReadable(date)}
                        </div>
                      </div>
                      <div className="space-y-3">{dayShifts.map((shift) => renderShiftCard(shift))}</div>
                    </div>
                  )
                })
              )}
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="sticky top-6 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Balance Snapshot</h2>
              <p className="text-sm text-slate-500">Live shift and hour totals for the team.</p>
            </div>

            <div className="space-y-3">
              {employeeLoads.length === 0 ? (
                <div className="text-sm text-slate-500">No employee load data yet.</div>
              ) : (
                employeeLoads.map((load: any) => (
                  <div key={load.user_id} className="rounded-xl border border-slate-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate font-medium text-slate-900">{load.display_name}</span>
                      <span className="text-xs font-semibold text-slate-500">{load.shift_count} shifts</span>
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{load.hours} hrs</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
