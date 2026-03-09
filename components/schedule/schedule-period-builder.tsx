"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { openSchedulePrintWindow } from "@/lib/schedule/print-export"
import { formatDateReadable, formatTimeRange } from "@/lib/schedule/time-format"
import {
  computeEmployeeLoads,
  recommendEmployeesForShift,
} from "@/lib/scheduling/recommendations"

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
const formatWeekday = (dateString: string) => weekdayLabels[new Date(`${dateString}T00:00:00`).getDay()]

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
  const [availabilityResponses, setAvailabilityResponses] = useState<AvailabilityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
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
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)
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
          .select("id, name, start_date, end_date, status, period_type, availability_link_token")
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
          .select("id, date, label, start_time, end_time, required_workers, shift_type_id, color")
          .eq("scheduling_period_id", periodId)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
      ])

    const normalizedShifts = ((shiftData as Shift[]) || []).filter(Boolean)

    setPeriod((periodData as Period) || null)
    setShiftTypes((((shiftTypeData as ShiftType[]) || []).filter((item) => item.is_active !== false)))
    setMembers((((memberData as Member[]) || []).filter((item) => item.role === "employee" || item.role === "manager")))
    setShifts(normalizedShifts)

    await refreshShiftState(normalizedShifts.map((shift) => shift.id), false)
    setLoading(false)
  }

  async function refreshShiftState(shiftIds: string[], showWorking = false) {
    if (shiftIds.length === 0) {
      setAssignments([])
      setAvailabilityResponses([])
      return
    }

    if (showWorking) setWorking(true)

    const [{ data: assignmentData }, { data: availabilityData }] = await Promise.all([
      supabase.from("shift_assignments").select("id, shift_id, employee_id, manual_name, status").in("shift_id", shiftIds),
      supabase.from("availability_responses").select("shift_id, employee_id, status, notes").in("shift_id", shiftIds),
    ])

    setAssignments((assignmentData as Assignment[]) || [])
    setAvailabilityResponses((availabilityData as AvailabilityResponse[]) || [])
    if (showWorking) setWorking(false)
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
    [assignments],
  )

  const availabilityByShift = useMemo(() => {
    const map: Record<string, AvailabilitySummary> = {}

    for (const shift of shifts) {
      const responses = availabilityResponses.filter((item) => item.shift_id === shift.id)
      const availableIds = new Set(
        responses
          .filter((item) => item.status === "available" || item.status === "all_day")
          .map((item) => item.employee_id),
      )
      const unavailableIds = new Set(
        responses.filter((item) => item.status === "unavailable").map((item) => item.employee_id),
      )
      const available = members.filter((item) => availableIds.has(item.user_id))
      const unavailable = members.filter((item) => unavailableIds.has(item.user_id))
      const noResponse = members.filter(
        (item) => !availableIds.has(item.user_id) && !unavailableIds.has(item.user_id),
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
    [shifts],
  )

  const calendarDates = useMemo(
    () => (period ? getDatesInRange(period.start_date, period.end_date) : []),
    [period],
  )

  const employeeLoads = useMemo(
    () =>
      computeEmployeeLoads(
        members.map((memberItem) => ({
          user_id: memberItem.user_id,
          display_name: memberItem.display_name,
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
        })),
      ),
    [members, shifts, assignments],
  )

  const selectedShift = useMemo(
    () => shifts.find((shift) => shift.id === selectedShiftId) || null,
    [shifts, selectedShiftId],
  )

  const quickAssignRecommendations = useMemo(
    () =>
      selectedShiftId
        ? recommendEmployeesForShift({
            shiftId: selectedShiftId,
            employees: members.map((memberItem) => ({
              user_id: memberItem.user_id,
              display_name: memberItem.display_name,
            })),
            shifts: shifts.map((shift) => ({
              id: shift.id,
              date: shift.date,
              start_time: shift.start_time,
              end_time: shift.end_time,
              required_workers: shift.required_workers,
            })),
            assignments: assignments.map((assignment) => ({
              shift_id: assignment.shift_id,
              employee_id: assignment.employee_id,
              status: assignment.status,
            })),
            availability: availabilityResponses.map((response) => ({
              shift_id: response.shift_id,
              employee_id: response.employee_id,
              status: response.status,
            })),
            limit: 5,
          })
        : [],
    [selectedShiftId, members, shifts, assignments, availabilityResponses],
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
    setSelectedShiftId(shift.id)
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
      current.includes(date) ? current.filter((item) => item !== date) : [...current, date],
    )
  }

  async function createSingleShift(event: React.FormEvent) {
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
      shifts.map((shift) => `${shift.date}|${shift.label}|${shift.start_time}|${shift.end_time}`),
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

  async function saveShiftEdits(event: React.FormEvent) {
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

    setShifts((current) => current.map((shift) => (shift.id === editingShiftId ? { ...shift, ...payload } : shift)))
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
    setAvailabilityResponses((current) => current.filter((response) => response.shift_id !== shiftId))

    if (selectedShiftId === shiftId) setSelectedShiftId(null)
    if (editingShiftId === shiftId) cancelEditingShift()
  }

  async function assignMember(shiftId: string, employeeId: string) {
    if (!member?.user_id) return

    const allowed = new Set((availabilityByShift[shiftId]?.available || []).map((person) => person.user_id))
    if (!allowed.has(employeeId)) {
      alert("Only employees who marked themselves available can be assigned to this shift.")
      return
    }

    if (
      (groupedAssignments[shiftId] || []).some(
        (assignment) => assignment.employee_id === employeeId && assignment.status === "assigned",
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

  async function moveShiftToDate(shiftId: string, newDate: string) {
    const { error } = await supabase.from("shifts").update({ date: newDate }).eq("id", shiftId)
    if (error) {
      alert(error.message)
      return
    }

    setShifts((current) => current.map((shift) => (shift.id === shiftId ? { ...shift, date: newDate } : shift)))
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
    const url = `${window.location.origin}/availability/${period.id}?token=${period.availability_link_token || ""}`
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
    const assigned = (groupedAssignments[shift.id] || []).filter((assignment) => assignment.status !== "dropped")
    const availablePeople = availabilityByShift[shift.id]?.available || []
    const selected = selectedShiftId === shift.id

    return (
      <div
        key={shift.id}
        className={`relative overflow-hidden rounded-2xl border bg-white p-4 pl-5 shadow-sm transition ${selected ? "ring-2 ring-blue-500" : ""}`}
      >
        <span
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ backgroundColor: shift.color || "#2563EB" }}
          aria-hidden="true"
        />

        <div className="flex flex-col gap-3">
          <div className="relative min-w-0 pr-16">
            <button
              type="button"
              onClick={() => setSelectedShiftId(shift.id)}
              className="block min-w-0 w-full text-left"
            >
              <h4 className="truncate text-base font-semibold leading-6 text-slate-900">
                {shift.label}
              </h4>
              <p className="mt-1 whitespace-nowrap text-sm font-medium text-slate-500">
                {formatTimeRange(shift.start_time, shift.end_time)}
              </p>
            </button>

            {isManager && period?.status !== "published" ? (
              <div className="absolute right-0 top-0 flex items-center gap-1">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    startEditingShift(shift)
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
                  aria-label={`Edit ${shift.label}`}
                  title="Edit shift"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    void deleteShift(shift.id)
                  }}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-red-600"
                  aria-label={`Delete ${shift.label}`}
                  title="Delete shift"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-1 flex flex-wrap gap-2">
            {assigned.length === 0 ? (
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">No one assigned yet</div>
            ) : (
              assigned.map((assignment) => {
                const assignedMember = members.find((item) => item.user_id === assignment.employee_id)
                const displayName = assignedMember?.display_name || assignment.manual_name || "Assigned"
                const isManual = Boolean(assignment.manual_name) && !assignment.employee_id

                return (
                  <div
                    key={assignment.id}
                    className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1 text-xs ${
                      isManual ? "bg-slate-100 text-slate-700 italic" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <span className="truncate">{displayName}</span>
                    {isManager && period?.status !== "published" ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          void unassignMember(assignment.id)
                        }}
                        className="font-semibold"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          {isManager && period?.status !== "published" ? (
            <div className="mt-4 space-y-3 border-t pt-4">
              <div>
                <Label className="mb-2 block text-sm">Assign available employee</Label>
                <select
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                  defaultValue=""
                  onChange={(event) => {
                    if (!event.target.value) return
                    void assignMember(shift.id, event.target.value)
                    event.currentTarget.value = ""
                  }}
                >
                  <option value="">Select available employee</option>
                  {availablePeople.map((employee) => (
                    <option key={employee.user_id} value={employee.user_id}>
                      {employee.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-2 block text-sm">Manual write-in</Label>
                <div className="flex gap-2">
                  <Input
                    value={manualNames[shift.id] || ""}
                    onChange={(event) =>
                      setManualNames((current) => ({ ...current, [shift.id]: event.target.value }))
                    }
                    placeholder="Write in name"
                    className="min-w-0"
                  />
                  <Button type="button" variant="outline" onClick={() => void assignManualName(shift.id)}>
                    Add
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500 shadow-sm">
        Loading schedule builder...
      </div>
    )
  }

  if (!period) {
    return (
      <div className="rounded-2xl border bg-white p-8 text-sm text-slate-500 shadow-sm">
        This scheduling period could not be found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{period.name}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(period.status)}`}>
                {period.status}
              </span>
              {working ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  Updating…
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              {formatDateReadable(period.start_date)} – {formatDateReadable(period.end_date)}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {period.status === "draft" ? (
              <Button type="button" onClick={() => void updateStatus("collecting")}>Open for Availability</Button>
            ) : null}
            {period.status === "collecting" ? (
              <Button type="button" onClick={() => void updateStatus("scheduling")}>Close Availability &amp; Start Scheduling</Button>
            ) : null}
            {period.status === "scheduling" ? (
              <Button type="button" onClick={() => void updateStatus("published")}>Publish Schedule</Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => void copyAvailabilityLink()}>
              Copy Availability Link
            </Button>
            <Button type="button" variant="outline" onClick={exportSchedule}>
              Export / Print
            </Button>
            {period.status === "published" ? (
              <Button type="button" variant="outline" onClick={() => void updateStatus("scheduling")}>
                Unpublish for Editing
              </Button>
            ) : null}
            {period.status === "published" || period.status === "scheduling" ? (
              <Button type="button" variant="outline" onClick={() => void archivePeriod()}>
                Archive
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Builder View</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manage shift creation, availability-aware assignments, and daily staffing coverage.
                </p>
              </div>
              <div className="inline-flex rounded-xl border bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("calendar")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    viewMode === "calendar" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Weekly Calendar View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
                >
                  List View
                </button>
              </div>
            </div>

            <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={createSingleShift}>
              <div>
                <Label className="mb-2 block">Shift template</Label>
                <select
                  value={newShiftTypeId}
                  onChange={(event) => fillFromShiftType(event.target.value)}
                  className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                >
                  <option value="">Custom shift</option>
                  {shiftTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} · {formatTimeRange(type.start_time, type.end_time)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="mb-2 block">Date</Label>
                <Input type="date" value={newShiftDate} onChange={(event) => setNewShiftDate(event.target.value)} required />
              </div>

              <div>
                <Label className="mb-2 block">Required workers</Label>
                <Input
                  type="number"
                  min="1"
                  value={newShiftRequiredWorkers}
                  onChange={(event) => setNewShiftRequiredWorkers(event.target.value)}
                />
              </div>

              <div>
                <Label className="mb-2 block">Shift label</Label>
                <Input
                  value={newShiftLabel}
                  onChange={(event) => setNewShiftLabel(event.target.value)}
                  placeholder="Morning Shift"
                  required
                />
              </div>

              <div>
                <Label className="mb-2 block">Start time</Label>
                <Input type="time" value={newShiftStart} onChange={(event) => setNewShiftStart(event.target.value)} required />
              </div>

              <div>
                <Label className="mb-2 block">End time</Label>
                <Input type="time" value={newShiftEnd} onChange={(event) => setNewShiftEnd(event.target.value)} required />
              </div>

              <div>
                <Label className="mb-2 block">Shift color</Label>
                <input
                  type="color"
                  value={newShiftColor}
                  onChange={(event) => setNewShiftColor(event.target.value)}
                  className="h-11 w-16 rounded border"
                />
              </div>

              <div className="flex items-end gap-2 xl:col-span-2">
                <Button type="submit">Add Shift</Button>
                <Button type="button" variant="outline" onClick={resetShiftForm}>
                  Reset
                </Button>
              </div>
            </form>

            <div className="mt-5 rounded-2xl border bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-900">Apply Shift Across Multiple Dates</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Reuse the current shift setup across the selected dates below.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => void createBulkShifts()}>
                  Create Bulk Shifts
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {calendarDates.map((date) => {
                  const selected = selectedBulkDates.includes(date)
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => toggleBulkDate(date)}
                      className={`rounded-xl border px-3 py-2 text-left text-sm ${
                        selected ? "border-blue-500 bg-blue-50 text-blue-700" : "bg-white text-slate-600"
                      }`}
                    >
                      <div className="font-medium">{formatWeekday(date)}</div>
                      <div className="text-xs">{formatDateReadable(date)}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {editingShiftId ? (
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Edit Shift</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Update the selected shift without leaving the builder.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={cancelEditingShift}>
                  Cancel
                </Button>
              </div>

              <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={saveShiftEdits}>
                <div>
                  <Label className="mb-2 block">Date</Label>
                  <Input type="date" value={editShiftDate} onChange={(event) => setEditShiftDate(event.target.value)} required />
                </div>

                <div>
                  <Label className="mb-2 block">Required workers</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editShiftRequiredWorkers}
                    onChange={(event) => setEditShiftRequiredWorkers(event.target.value)}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Shift color</Label>
                  <input
                    type="color"
                    value={editShiftColor}
                    onChange={(event) => setEditShiftColor(event.target.value)}
                    className="h-11 w-16 rounded border"
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Shift label</Label>
                  <Input
                    value={editShiftLabel}
                    onChange={(event) => setEditShiftLabel(event.target.value)}
                    placeholder="Morning Shift"
                    required
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Start time</Label>
                  <Input type="time" value={editShiftStart} onChange={(event) => setEditShiftStart(event.target.value)} required />
                </div>

                <div>
                  <Label className="mb-2 block">End time</Label>
                  <Input type="time" value={editShiftEnd} onChange={(event) => setEditShiftEnd(event.target.value)} required />
                </div>

                <div className="flex items-end gap-2 xl:col-span-3">
                  <Button type="submit">Save Shift Changes</Button>
                  <Button type="button" variant="outline" onClick={() => editingShiftId && void deleteShift(editingShiftId)}>
                    Delete Shift
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {selectedShift ? (
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Selected Shift</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedShift.label} · {formatDateReadable(selectedShift.date)} · {formatTimeRange(selectedShift.start_time, selectedShift.end_time)}
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {quickAssignRecommendations.length} quick recommendation{quickAssignRecommendations.length === 1 ? "" : "s"}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border bg-emerald-50 p-4">
                  <h3 className="font-semibold text-emerald-900">Available Employees</h3>
                  <div className="mt-3 space-y-2">
                    {(availabilityByShift[selectedShift.id]?.available || []).map((person) => {
                      const load = employeeLoads.find((entry) => entry.user_id === person.user_id)
                      return (
                        <div key={person.user_id} className="rounded-xl bg-white/90 p-3 text-sm">
                          <div className="font-medium text-slate-900">{person.display_name}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            {load?.shiftCount ?? 0} shifts · {(load?.hours ?? 0).toFixed(1)} hrs
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border bg-amber-50 p-4">
                  <h3 className="font-semibold text-amber-900">No Response</h3>
                  <div className="mt-3 space-y-2">
                    {(availabilityByShift[selectedShift.id]?.noResponse || []).map((person) => (
                      <div key={person.user_id} className="rounded-xl bg-white/90 p-3 text-sm text-slate-700">
                        {person.display_name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border bg-slate-50 p-4">
                  <h3 className="font-semibold text-slate-900">Quick Assign Suggestions</h3>
                  <div className="mt-3 space-y-2">
                    {quickAssignRecommendations.length === 0 ? (
                      <div className="rounded-xl border border-dashed bg-white p-3 text-sm text-slate-500">
                        Select a shift to see assignment guidance.
                      </div>
                    ) : (
                      quickAssignRecommendations.map((item: any) => (
                        <div key={item.user_id} className="rounded-xl bg-white p-3 text-sm">
                          <div className="font-medium text-slate-900">{item.display_name}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {viewMode === "calendar" ? (
            <div className="grid gap-4 xl:grid-cols-7">
              {calendarDates.map((date) => (
                <div key={date} className="rounded-3xl border bg-slate-50 p-3 shadow-sm">
                  <div className="mb-3">
                    <div className="text-sm font-semibold text-slate-900">{formatWeekday(date)}</div>
                    <div className="text-xs text-slate-500">{formatDateReadable(date)}</div>
                  </div>

                  <div className="space-y-3">
                    {(shiftsByDate[date] || []).length === 0 ? (
                      <div className="rounded-2xl border border-dashed bg-white p-4 text-sm text-slate-500">No shifts</div>
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
                <div className="rounded-3xl border bg-white p-8 text-sm text-slate-500 shadow-sm">
                  No shifts have been added yet.
                </div>
              ) : (
                shifts.map((shift) => renderShiftCard(shift))
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
