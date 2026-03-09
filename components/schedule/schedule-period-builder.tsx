"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
  period_type: string
}

type ShiftType = {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
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
}

type Assignment = {
  id: string
  shift_id: string
  employee_id: string | null
  manual_name: string | null
  status: string
}

export function SchedulePeriodBuilder({ periodId }: { periodId: string }) {
  const supabase = createClient()
  const { organization, member, isManager } = useOrgSafe()

  const [period, setPeriod] = useState<Period | null>(null)
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  const [newShiftDate, setNewShiftDate] = useState("")
  const [newShiftTypeId, setNewShiftTypeId] = useState("")
  const [newShiftLabel, setNewShiftLabel] = useState("")
  const [newShiftStart, setNewShiftStart] = useState("")
  const [newShiftEnd, setNewShiftEnd] = useState("")
  const [newShiftRequiredWorkers, setNewShiftRequiredWorkers] = useState("1")

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
          .select("id, name, start_date, end_date, status, period_type")
          .eq("id", periodId)
          .single(),
        supabase
          .from("shift_types")
          .select("id, name, start_time, end_time, color")
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
          .select("id, date, label, start_time, end_time, required_workers, shift_type_id")
          .eq("scheduling_period_id", periodId)
          .order("date", { ascending: true }),
      ])

    setPeriod((periodData as Period) || null)
    setShiftTypes((shiftTypeData as ShiftType[]) || [])
    setMembers(((memberData as Member[]) || []).filter((m) => m.role === "employee" || m.role === "manager"))
    setShifts((shiftData as Shift[]) || [])

    const shiftIds = ((shiftData as Shift[]) || []).map((shift) => shift.id)

    if (shiftIds.length > 0) {
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
  }, [organization?.id, periodId])

  const groupedAssignments = useMemo(() => {
    return assignments.reduce<Record<string, Assignment[]>>((acc, assignment) => {
      if (!acc[assignment.shift_id]) acc[assignment.shift_id] = []
      acc[assignment.shift_id].push(assignment)
      return acc
    }, {})
  }, [assignments])

  function fillFromShiftType(shiftTypeId: string) {
    setNewShiftTypeId(shiftTypeId)
    const selected = shiftTypes.find((item) => item.id === shiftTypeId)
    if (!selected) return

    setNewShiftLabel(selected.name)
    setNewShiftStart(selected.start_time)
    setNewShiftEnd(selected.end_time)
  }

  async function createShift(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!periodId) return

    const { error } = await supabase.from("shifts").insert({
      scheduling_period_id: periodId,
      shift_type_id: newShiftTypeId || null,
      date: newShiftDate,
      label: newShiftLabel,
      start_time: newShiftStart,
      end_time: newShiftEnd,
      required_workers: Number(newShiftRequiredWorkers || "1"),
      color: "#3B82F6",
    })

    if (error) {
      alert(error.message)
      return
    }

    setNewShiftDate("")
    setNewShiftTypeId("")
    setNewShiftLabel("")
    setNewShiftStart("")
    setNewShiftEnd("")
    setNewShiftRequiredWorkers("1")
    await loadData()
  }

  async function assignMember(shiftId: string, employeeId: string) {
    if (!member?.user_id || !employeeId) return

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

  async function unassignMember(assignmentId: string) {
    const { error } = await supabase
      .from("shift_assignments")
      .delete()
      .eq("id", assignmentId)

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  async function publishPeriod() {
    if (!period) return

    const { error } = await supabase
      .from("scheduling_periods")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", period.id)

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  if (loading) {
    return <div className="rounded-lg border bg-white p-6">Loading schedule builder...</div>
  }

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No organization selected.</div>
  }

  if (!period) {
    return <div className="rounded-lg border bg-white p-6">Schedule period not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{period.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {period.start_date} → {period.end_date} · {period.status}
            </p>
          </div>

          {isManager ? (
            <Button onClick={publishPeriod}>
              Publish Schedule
            </Button>
          ) : null}
        </div>
      </div>

      {isManager ? (
        <form className="rounded-lg border bg-white p-6 space-y-4" onSubmit={createShift}>
          <h2 className="text-lg font-semibold">Add Shift</h2>

          <div>
            <Label htmlFor="shiftType">Shift type</Label>
            <select
              id="shiftType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={newShiftTypeId}
              onChange={(e) => fillFromShiftType(e.target.value)}
            >
              <option value="">Custom shift</option>
              {shiftTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="shiftDate">Date</Label>
              <Input
                id="shiftDate"
                type="date"
                value={newShiftDate}
                onChange={(e) => setNewShiftDate(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="requiredWorkers">Required workers</Label>
              <Input
                id="requiredWorkers"
                type="number"
                min="1"
                value={newShiftRequiredWorkers}
                onChange={(e) => setNewShiftRequiredWorkers(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="shiftLabel">Shift label</Label>
            <Input
              id="shiftLabel"
              value={newShiftLabel}
              onChange={(e) => setNewShiftLabel(e.target.value)}
              placeholder="Morning Shift"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="startTime">Start time</Label>
              <Input
                id="startTime"
                type="time"
                value={newShiftStart}
                onChange={(e) => setNewShiftStart(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End time</Label>
              <Input
                id="endTime"
                type="time"
                value={newShiftEnd}
                onChange={(e) => setNewShiftEnd(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit">Add Shift</Button>
        </form>
      ) : null}

      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold">Shifts</h2>

        {shifts.length === 0 ? (
          <div className="mt-4 text-sm text-slate-600">
            No shifts have been added yet.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {shifts.map((shift) => {
              const assigned = groupedAssignments[shift.id] || []
              return (
                <div key={shift.id} className="rounded-lg border p-4">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-medium text-slate-900">
                        {shift.label}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {shift.date} · {shift.start_time} - {shift.end_time} · {assigned.length}/{shift.required_workers} assigned
                      </div>
                    </div>

                    {isManager ? (
                      <div className="w-full md:w-64">
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            if (!e.target.value) return
                            void assignMember(shift.id, e.target.value)
                            e.currentTarget.value = ""
                          }}
                        >
                          <option value="">Assign employee</option>
                          {members.map((employee) => (
                            <option key={employee.user_id} value={employee.user_id}>
                              {employee.display_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {assigned.length === 0 ? (
                      <span className="text-sm text-slate-500">No one assigned yet.</span>
                    ) : (
                      assigned.map((assignment) => {
                        const assignedMember = members.find((item) => item.user_id === assignment.employee_id)
                        return (
                          <div
                            key={assignment.id}
                            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm"
                          >
                            <span>{assignedMember?.display_name || assignment.manual_name || "Assigned"}</span>
                            {isManager ? (
                              <button
                                className="text-slate-500 hover:text-red-600"
                                onClick={() => void unassignMember(assignment.id)}
                                type="button"
                              >
                                ×
                              </button>
                            ) : null}
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
