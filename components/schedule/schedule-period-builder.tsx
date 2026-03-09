"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { openSchedulePrintWindow } from "@/lib/schedule/print-export"
import { formatDateReadable, formatTimeRange } from "@/lib/schedule/time-format"
import { computeEmployeeLoads, recommendEmployeesForShift } from "@/lib/scheduling/recommendations"
import { ManagerInsightsPanel } from "@/components/schedule/manager-insights-panel"
import { QuickAssignPanel } from "@/components/schedule/quick-assign-panel"
import { DraggableShiftCard } from "@/components/schedule/draggable-shift-card"
import { DropTargetDay } from "@/components/schedule/drop-target-day"

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
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar")
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [newShiftDate, setNewShiftDate] = useState("")
  const [newShiftTypeId, setNewShiftTypeId] = useState("")
  const [newShiftLabel, setNewShiftLabel] = useState("")
  const [newShiftStart, setNewShiftStart] = useState("")
  const [newShiftEnd, setNewShiftEnd] = useState("")
  const [newShiftRequiredWorkers, setNewShiftRequiredWorkers] = useState("1")
  const [selectedBulkDates, setSelectedBulkDates] = useState<string[]>([])
  const [bulkCreating, setBulkCreating] = useState(false)
  const [manualNames, setManualNames] = useState<Record<string, string>>({})
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null)

  async function loadData() {
    if (!organization) {
      setLoading(false)
      return
    }

    setLoading(true)
    const [{ data: periodData }, { data: shiftTypeData }, { data: memberData }, { data: shiftData }] =
      await Promise.all([
        supabase.from("scheduling_periods").select("id, name, start_date, end_date, status, period_type, availability_link_token").eq("id", periodId).single(),
        supabase.from("shift_types").select("id, name, start_time, end_time, color, required_workers, is_active").eq("organization_id", organization.id).order("name"),
        supabase.from("organization_members").select("id, user_id, display_name, role, is_active").eq("organization_id", organization.id).eq("is_active", true).order("display_name"),
        supabase.from("shifts").select("id, date, label, start_time, end_time, required_workers, shift_type_id, color").eq("scheduling_period_id", periodId).order("date", { ascending: true }).order("start_time", { ascending: true }),
      ])

    const normalizedMembers = ((memberData as Member[]) || []).filter((m) => m.role === "employee" || m.role === "manager")
    const normalizedShifts = (shiftData as Shift[]) || []
    const shiftIds = normalizedShifts.map((shift) => shift.id)

    setPeriod((periodData as Period) || null)
    setShiftTypes((((shiftTypeData as ShiftType[]) || []).filter((t) => t.is_active !== false)))
    setMembers(normalizedMembers)
    setShifts(normalizedShifts)

    if (shiftIds.length > 0) {
      const [{ data: assignmentData }, { data: availabilityData }] = await Promise.all([
        supabase.from("shift_assignments").select("id, shift_id, employee_id, manual_name, status").in("shift_id", shiftIds),
        supabase.from("availability_responses").select("shift_id, employee_id, status, notes").in("shift_id", shiftIds),
      ])
      setAssignments((assignmentData as Assignment[]) || [])
      setAvailabilityResponses((availabilityData as AvailabilityResponse[]) || [])
    } else {
      setAssignments([])
      setAvailabilityResponses([])
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [organization?.id, periodId])

  const groupedAssignments = useMemo(() => {
    return assignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
      if (!acc[assignment.shift_id]) acc[assignment.shift_id] = []
      acc[assignment.shift_id].push(assignment)
      return acc
    }, {})
  }, [assignments])

  const calendarDates = useMemo(() => {
    if (!period) return []
    return getDatesInRange(period.start_date, period.end_date)
  }, [period])

  const shiftsByDate = useMemo(() => {
    return shifts.reduce<Record<string, Shift[]>>((acc, shift) => {
      if (!acc[shift.date]) acc[shift.date] = []
      acc[shift.date].push(shift)
      return acc
    }, {})
  }, [shifts])

  const employeeLoads = useMemo(() => {
    return computeEmployeeLoads(
      members.map((m) => ({ user_id: m.user_id, display_name: m.display_name })),
      shifts.map((s) => ({ id: s.id, date: s.date, start_time: s.start_time, end_time: s.end_time, required_workers: s.required_workers })),
      assignments.map((a) => ({ shift_id: a.shift_id, employee_id: a.employee_id, status: a.status }))
    )
  }, [members, shifts, assignments])

  const filteredEmployeeLoads = useMemo(() => {
    const query = employeeSearch.trim().toLowerCase()
    if (!query) return employeeLoads
    return employeeLoads.filter((employee) => employee.display_name.toLowerCase().includes(query))
  }, [employeeLoads, employeeSearch])

  const understaffedShiftCount = useMemo(() => {
    return shifts.filter((shift) => {
      const assigned = (groupedAssignments[shift.id] || []).filter((a) => a.status !== "dropped")
      return assigned.length < shift.required_workers
    }).length
  }, [shifts, groupedAssignments])

  const selectedShift = useMemo(() => shifts.find((shift) => shift.id === selectedShiftId) || null, [shifts, selectedShiftId])

  const quickAssignRecommendations = useMemo(() => {
    if (!selectedShiftId) return []
    return recommendEmployeesForShift({
      shiftId: selectedShiftId,
      employees: members.map((m) => ({ user_id: m.user_id, display_name: m.display_name })),
      shifts: shifts.map((s) => ({ id: s.id, date: s.date, start_time: s.start_time, end_time: s.end_time, required_workers: s.required_workers })),
      assignments: assignments.map((a) => ({ shift_id: a.shift_id, employee_id: a.employee_id, status: a.status })),
      availability: availabilityResponses.map((a) => ({ shift_id: a.shift_id, employee_id: a.employee_id, status: a.status })),
      limit: 5,
    })
  }, [selectedShiftId, members, shifts, assignments, availabilityResponses])

  function fillFromShiftType(shiftTypeId: string) {
    setNewShiftTypeId(shiftTypeId)
    const selected = shiftTypes.find((item) => item.id === shiftTypeId)
    if (!selected) return
    setNewShiftLabel(selected.name)
    setNewShiftStart(selected.start_time)
    setNewShiftEnd(selected.end_time)
    setNewShiftRequiredWorkers(String(selected.required_workers || 1))
  }

  function resetShiftForm() {
    setNewShiftDate("")
    setNewShiftTypeId("")
    setNewShiftLabel("")
    setNewShiftStart("")
    setNewShiftEnd("")
    setNewShiftRequiredWorkers("1")
    setSelectedBulkDates([])
  }

  async function createSingleShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
      color: template?.color || "#3B82F6",
    })
    if (error) {
      alert(error.message)
      return
    }
    resetShiftForm()
    await loadData()
  }

  function toggleBulkDate(date: string) {
    setSelectedBulkDates((prev) => prev.includes(date) ? prev.filter((item) => item !== date) : [...prev, date])
  }

  async function createBulkShifts() {
    if (!periodId || selectedBulkDates.length === 0) {
      alert("Choose at least one date for bulk creation.")
      return
    }

    const template = shiftTypes.find((item) => item.id === newShiftTypeId)
    const existingKeys = new Set(shifts.map((shift) => `${shift.date}|${shift.label}|${shift.start_time}|${shift.end_time}`))
    const rows = selectedBulkDates
      .filter((date) => !existingKeys.has(`${date}|${newShiftLabel}|${newShiftStart}|${newShiftEnd}`))
      .map((date) => ({
        scheduling_period_id: periodId,
        shift_type_id: newShiftTypeId || null,
        date,
        label: newShiftLabel,
        start_time: newShiftStart,
        end_time: newShiftEnd,
        required_workers: Number(newShiftRequiredWorkers || "1"),
        color: template?.color || "#3B82F6",
      }))

    if (rows.length === 0) {
      alert("All selected dates already have this same shift.")
      return
    }

    setBulkCreating(true)
    const { error } = await supabase.from("shifts").insert(rows)
    setBulkCreating(false)

    if (error) {
      alert(error.message)
      return
    }

    resetShiftForm()
    await loadData()
  }

  async function assignMember(shiftId: string, employeeId: string) {
    if (!member?.user_id || !employeeId) return

    const alreadyAssigned = (groupedAssignments[shiftId] || []).some(
      (assignment) => assignment.employee_id === employeeId && assignment.status === "assigned"
    )
    if (alreadyAssigned) {
      alert("That employee is already assigned to this shift.")
      return
    }

    const { error } = await supabase.from("shift_assignments").insert({
      shift_id: shiftId,
      employee_id: employeeId,
      assigned_by: member.user_id,
      status: "assigned",
    })

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  async function assignManualName(shiftId: string) {
    if (!member?.user_id) return
    const manualName = (manualNames[shiftId] || "").trim()
    if (!manualName) {
      alert("Enter a name first.")
      return
    }

    const { error } = await supabase.from("shift_assignments").insert({
      shift_id: shiftId,
      manual_name: manualName,
      assigned_by: member.user_id,
      status: "assigned",
    })
    if (error) {
      alert(error.message)
      return
    }

    setManualNames((prev) => ({ ...prev, [shiftId]: "" }))
    await loadData()
  }

  async function unassignMember(assignmentId: string) {
    const { error } = await supabase.from("shift_assignments").delete().eq("id", assignmentId)
    if (error) {
      alert(error.message)
      return
    }
    await loadData()
  }

  async function moveShiftToDate(shiftId: string, newDate: string) {
    const { error } = await supabase.from("shifts").update({ date: newDate }).eq("id", shiftId)
    if (error) {
      alert(error.message)
      return
    }
    await loadData()
  }

  async function updateStatus(nextStatus: "collecting" | "scheduling" | "published") {
    if (!period) return
    const updatePayload: Record<string, string | null> = { status: nextStatus }
    if (nextStatus === "published") {
      updatePayload.published_at = new Date().toISOString()
    } else {
      updatePayload.published_at = null
    }

    const { error } = await supabase.from("scheduling_periods").update(updatePayload).eq("id", period.id)
    if (error) {
      alert(error.message)
      return
    }
    await loadData()
  }

  async function archivePeriod() {
    if (!period || !organization || !member?.user_id) return
    const confirmed = window.confirm("Archive this period and move it to History?")
    if (!confirmed) return

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

    const { error: archiveError } = await supabase.from("schedule_archives").insert({
      scheduling_period_id: period.id,
      organization_id: organization.id,
      snapshot_data: snapshot,
      archived_by: member.user_id,
    })
    if (archiveError) {
      alert(archiveError.message)
      return
    }

    const { error: periodError } = await supabase.from("scheduling_periods").update({ status: "archived" }).eq("id", period.id)
    if (periodError) {
      alert(periodError.message)
      return
    }

    alert("Schedule archived.")
    await loadData()
  }

  async function copyAvailabilityLink() {
    if (!period || typeof window === "undefined") return
    const token = period.availability_link_token || ""
    const url = `${window.location.origin}/availability/${period.id}?token=${token}`
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
      members: members.map((m) => ({ id: m.id, user_id: m.user_id, display_name: m.display_name })),
      startDate: period.start_date,
      endDate: period.end_date,
    })
  }

  function renderShiftCard(shift: Shift) {
    const assigned = groupedAssignments[shift.id] || []
    return (
      <DraggableShiftCard
        key={shift.id}
        shiftId={shift.id}
        label={shift.label}
        timeLabel={formatTimeRange(shift.start_time, shift.end_time)}
        assignedCount={`${assigned.length}/${shift.required_workers} assigned`}
      >
        <div className="space-y-2">
          <Button size="sm" variant={selectedShiftId === shift.id ? "default" : "outline"} onClick={() => setSelectedShiftId(shift.id)}>
            {selectedShiftId === shift.id ? "Selected" : "Select Shift"}
          </Button>

          {isManager && period?.status !== "published" ? (
            <div className="space-y-2">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return
                  void assignMember(shift.id, e.target.value)
                  e.currentTarget.value = ""
                }}
              >
                <option value="">Assign available</option>
                {members.map((employee) => (
                  <option key={employee.user_id} value={employee.user_id}>
                    {employee.display_name}
                  </option>
                ))}
              </select>

              <div className="flex gap-2">
                <Input
                  value={manualNames[shift.id] || ""}
                  onChange={(e) => setManualNames((prev) => ({ ...prev, [shift.id]: e.target.value }))}
                  placeholder="Write in name"
                />
                <Button type="button" variant="outline" onClick={() => void assignManualName(shift.id)}>
                  Add
                </Button>
              </div>
            </div>
          ) : null}

          {assigned.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {assigned.map((assignment) => {
                const assignedMember = members.find((item) => item.user_id === assignment.employee_id)
                const displayName = assignedMember?.display_name || assignment.manual_name || "Assigned"
                const isManual = Boolean(assignment.manual_name) && !assignment.employee_id

                return (
                  <div key={assignment.id} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs">
                    <span className={isManual ? "italic text-slate-700" : ""}>{displayName}</span>
                    {isManager && period?.status !== "published" ? (
                      <button className="text-slate-500 hover:text-red-600" onClick={() => void unassignMember(assignment.id)} type="button">
                        ×
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </DraggableShiftCard>
    )
  }

  if (loading) return <div className="rounded-3xl border bg-white p-6 shadow-sm">Loading schedule builder...</div>
  if (!organization) return <div className="rounded-3xl border bg-white p-6 shadow-sm">No organization selected.</div>
  if (!period) return <div className="rounded-3xl border bg-white p-6 shadow-sm">Schedule period not found.</div>

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold md:text-2xl">{period.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {formatDateReadable(period.start_date)} – {formatDateReadable(period.end_date)} · {period.status}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
            <Button type="button" variant={viewMode === "calendar" ? "default" : "outline"} className="w-full" onClick={() => setViewMode("calendar")}>
              Calendar
            </Button>
            <Button type="button" variant={viewMode === "list" ? "default" : "outline"} className="w-full" onClick={() => setViewMode("list")}>
              List
            </Button>
            <Button type="button" variant="outline" className="w-full" onClick={exportSchedule}>
              Export
            </Button>

            {isManager ? (
              <>
                {period.status === "draft" ? <Button className="w-full sm:w-auto" onClick={() => void updateStatus("collecting")}>Open</Button> : null}
                {period.status === "collecting" ? (
                  <>
                    <Button className="w-full sm:w-auto" variant="outline" onClick={copyAvailabilityLink}>Link</Button>
                    <Button className="w-full sm:w-auto" onClick={() => void updateStatus("scheduling")}>Close</Button>
                  </>
                ) : null}
                {period.status === "scheduling" ? <Button className="w-full sm:w-auto" onClick={() => void updateStatus("published")}>Publish</Button> : null}
                {period.status === "published" ? (
                  <>
                    <Button className="w-full sm:w-auto" variant="outline" onClick={() => void updateStatus("scheduling")}>Unpublish</Button>
                    <Button className="w-full sm:w-auto" variant="outline" onClick={() => void archivePeriod()}>Archive</Button>
                  </>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px_320px]">
        <div className="space-y-4 md:space-y-6">
          {isManager ? (
            <div className="rounded-xl border bg-white p-4 shadow-sm md:p-6 space-y-4">
              <h2 className="text-lg font-semibold">Add Single Shift</h2>
              <form className="space-y-4" onSubmit={createSingleShift}>
                <div>
                  <Label htmlFor="shiftType">Shift template</Label>
                  <select id="shiftType" className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newShiftTypeId} onChange={(e) => fillFromShiftType(e.target.value)}>
                    <option value="">Custom shift</option>
                    {shiftTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} · {formatTimeRange(type.start_time, type.end_time)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="shiftDate">Date</Label>
                    <Input id="shiftDate" type="date" value={newShiftDate} onChange={(e) => setNewShiftDate(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="requiredWorkers">Required workers</Label>
                    <Input id="requiredWorkers" type="number" min="1" value={newShiftRequiredWorkers} onChange={(e) => setNewShiftRequiredWorkers(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="shiftLabel">Shift label</Label>
                  <Input id="shiftLabel" value={newShiftLabel} onChange={(e) => setNewShiftLabel(e.target.value)} placeholder="Morning Shift" required />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="startTime">Start time</Label>
                    <Input id="startTime" type="time" value={newShiftStart} onChange={(e) => setNewShiftStart(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End time</Label>
                    <Input id="endTime" type="time" value={newShiftEnd} onChange={(e) => setNewShiftEnd(e.target.value)} required />
                  </div>
                </div>
                <Button className="w-full sm:w-auto" type="submit">Add Shift</Button>
              </form>

              <div className="space-y-3 pt-2">
                <h3 className="text-base font-semibold text-slate-900">Apply Shift Across Multiple Dates</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedBulkDates.length === 0 ? (
                    <span className="text-sm text-slate-500">No dates selected yet.</span>
                  ) : (
                    selectedBulkDates.map((date) => (
                      <span key={date} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                        {formatDateReadable(date)}
                      </span>
                    ))
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-7">
                  {calendarDates.map((date) => {
                    const selected = selectedBulkDates.includes(date)
                    return (
                      <Button key={date} type="button" variant={selected ? "default" : "outline"} className="h-auto min-h-[56px] flex-col py-3" onClick={() => toggleBulkDate(date)}>
                        <span className="text-[11px] uppercase tracking-wide">{formatWeekday(date)}</span>
                        <span className="mt-1 text-[11px] leading-tight">{formatDateReadable(date)}</span>
                      </Button>
                    )
                  })}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setSelectedBulkDates([])} disabled={selectedBulkDates.length === 0}>Clear Dates</Button>
                  <Button type="button" className="w-full sm:w-auto" onClick={() => void createBulkShifts()} disabled={bulkCreating || selectedBulkDates.length === 0 || !newShiftLabel || !newShiftStart || !newShiftEnd}>
                    {bulkCreating ? "Creating..." : "Apply to Selected Dates"}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          {viewMode === "calendar" ? (
            <>
              <div className="rounded-xl border bg-white p-4 shadow-sm md:hidden">
                <div className="space-y-4">
                  {calendarDates.map((date) => (
                    <DropTargetDay key={date} date={date} onShiftDrop={(shiftId, newDate) => void moveShiftToDate(shiftId, newDate)}>
                      <div className="border-b pb-2">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{formatWeekday(date)}</div>
                        <div className="mt-1 text-sm font-medium text-slate-900">{formatDateReadable(date)}</div>
                      </div>
                      <div className="mt-3 space-y-3">
                        {(shiftsByDate[date] || []).length === 0 ? (
                          <div className="rounded-lg border border-dashed bg-white p-3 text-xs text-slate-500">No shifts</div>
                        ) : (
                          (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift))
                        )}
                      </div>
                    </DropTargetDay>
                  ))}
                </div>
              </div>

              <div className="hidden rounded-xl border bg-white p-6 shadow-sm md:block">
                <h2 className="text-lg font-semibold">Weekly Calendar View</h2>
                <div className="mt-4 overflow-x-auto">
                  <div className="grid min-w-[1100px] grid-cols-7 gap-4">
                    {calendarDates.map((date) => (
                      <DropTargetDay key={date} date={date} onShiftDrop={(shiftId, newDate) => void moveShiftToDate(shiftId, newDate)}>
                        <div className="border-b pb-2">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{formatWeekday(date)}</div>
                          <div className="mt-1 text-sm font-medium text-slate-900">{formatDateReadable(date)}</div>
                        </div>
                        <div className="mt-3 space-y-3">
                          {(shiftsByDate[date] || []).length === 0 ? (
                            <div className="rounded-lg border border-dashed bg-white p-3 text-xs text-slate-500">No shifts</div>
                          ) : (
                            (shiftsByDate[date] || []).map((shift) => renderShiftCard(shift))
                          )}
                        </div>
                      </DropTargetDay>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border bg-white p-4 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold">List View</h2>
              {shifts.length === 0 ? (
                <div className="mt-4 text-sm text-slate-600">No shifts have been added yet.</div>
              ) : (
                <div className="mt-4 space-y-4">{shifts.map((shift) => renderShiftCard(shift))}</div>
              )}
            </div>
          )}
        </div>

        {isManager ? (
          <>
            <aside className="space-y-4">
              <div className="rounded-xl border bg-white p-4 shadow-sm md:p-5">
                <h2 className="text-lg font-semibold">Employee Load</h2>
                <div className="mt-4">
                  <Input value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} placeholder="Search employees" />
                </div>
                <div className="mt-4 space-y-3">
                  {filteredEmployeeLoads.length === 0 ? (
                    <div className="text-sm text-slate-500">No employees found.</div>
                  ) : (
                    filteredEmployeeLoads.map((employee) => (
                      <div key={employee.user_id} className="rounded-lg border p-3">
                        <div className="font-medium text-slate-900">{employee.display_name}</div>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <div className="rounded-md bg-slate-50 p-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">Shifts</div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">{employee.shiftCount}</div>
                          </div>
                          <div className="rounded-md bg-slate-50 p-2">
                            <div className="text-[11px] uppercase tracking-wide text-slate-500">Hours</div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">{employee.hours.toFixed(1)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>

            <aside className="space-y-4">
              <ManagerInsightsPanel loads={employeeLoads} understaffedShiftCount={understaffedShiftCount} />
              <QuickAssignPanel
                shiftLabel={selectedShift?.label || "No shift selected"}
                recommended={quickAssignRecommendations}
                onAssign={(employeeId) => {
                  if (!selectedShiftId) return
                  void assignMember(selectedShiftId, employeeId)
                }}
              />
            </aside>
          </>
        ) : null}
      </div>
    </div>
  )
}
