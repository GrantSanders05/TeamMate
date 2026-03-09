"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

type Shift = {
  id: string
  date: string
  label: string
  start_time: string
  end_time: string
  scheduling_period_id: string
}

type Assignment = {
  id: string
  shift_id: string
  employee_id: string | null
  status: string
}

type Member = {
  user_id: string
  display_name: string
}

type DropRequestRow = {
  id: string
  assignment_id: string
  requested_by: string
  reason: string | null
  status: "pending" | "approved" | "denied"
  assignments: Assignment | null
}

export function ManagerDropRequests() {
  const supabase = createClient()
  const { organization, member, isManager, isLoading } = useOrgSafe()
  const [requests, setRequests] = useState<DropRequestRow[]>([])
  const [shiftMap, setShiftMap] = useState<Record<string, Shift>>({})
  const [memberMap, setMemberMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [workingId, setWorkingId] = useState<string | null>(null)

  async function loadData() {
    if (!organization) {
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: periodData } = await supabase
      .from("scheduling_periods")
      .select("id")
      .eq("organization_id", organization.id)

    const periodIds = (((periodData as { id: string }[]) || []).map((p) => p.id))

    const { data: shiftData } = await supabase
      .from("shifts")
      .select("id, date, label, start_time, end_time, scheduling_period_id")
      .in("scheduling_period_id", periodIds.length > 0 ? periodIds : ["00000000-0000-0000-0000-000000000000"])

    const shifts = (shiftData as Shift[]) || []
    const shiftsById = Object.fromEntries(shifts.map((s) => [s.id, s]))
    setShiftMap(shiftsById)

    const shiftIds = shifts.map((s) => s.id)

    const { data: assignmentData } = await supabase
      .from("shift_assignments")
      .select("id, shift_id, employee_id, status")
      .in("shift_id", shiftIds.length > 0 ? shiftIds : ["00000000-0000-0000-0000-000000000000"])

    const assignments = (assignmentData as Assignment[]) || []
    const assignmentMap = Object.fromEntries(assignments.map((a) => [a.id, a]))
    const assignmentIds = assignments.map((a) => a.id)

    const { data: requestData } = await supabase
      .from("drop_requests")
      .select("id, assignment_id, requested_by, reason, status")
      .in("assignment_id", assignmentIds.length > 0 ? assignmentIds : ["00000000-0000-0000-0000-000000000000"])
      .order("created_at", { ascending: false })

    const normalizedRequests = (((requestData as { id: string; assignment_id: string; requested_by: string; reason: string | null; status: "pending" | "approved" | "denied" }[]) || []).map((r) => ({
      ...r,
      assignments: assignmentMap[r.assignment_id] || null,
    })))

    setRequests(normalizedRequests)

    const { data: memberData } = await supabase
      .from("organization_members")
      .select("user_id, display_name")
      .eq("organization_id", organization.id)

    setMemberMap(Object.fromEntries((((memberData as Member[]) || []).map((m) => [m.user_id, m.display_name]))))
    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [organization?.id])

  async function reviewRequest(requestId: string, assignmentId: string, nextStatus: "approved" | "denied") {
    if (!member?.user_id) return

    setWorkingId(requestId)

    const { error } = await supabase
      .from("drop_requests")
      .update({
        status: nextStatus,
        reviewed_by: member.user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId)

    if (error) {
      setWorkingId(null)
      alert(error.message)
      return
    }

    if (nextStatus === "approved") {
      const { error: assignmentError } = await supabase
        .from("shift_assignments")
        .update({ status: "dropped" })
        .eq("id", assignmentId)

      if (assignmentError) {
        setWorkingId(null)
        alert(assignmentError.message)
        return
      }
    }

    setWorkingId(null)
    await loadData()
  }

  if (isLoading || loading) {
    return <div className="rounded-lg border bg-white p-6">Loading drop requests...</div>
  }

  if (!organization) {
    return <div className="rounded-lg border bg-white p-6">No active organization selected.</div>
  }

  if (!isManager) {
    return <div className="rounded-lg border bg-white p-6">Only managers can review drop requests.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">Drop Requests</h1>
        <p className="mt-2 text-sm text-slate-600">
          Review pending requests from employees who need to drop published shifts.
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {requests.length === 0 ? (
          <div className="text-sm text-slate-600">No drop requests yet.</div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const assignment = request.assignments
              const shift = assignment ? shiftMap[assignment.shift_id] : null
              const employeeName = request.requested_by ? memberMap[request.requested_by] : "Employee"

              return (
                <div key={request.id} className="rounded-lg border p-4">
                  <div className="font-medium text-slate-900">{employeeName}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {shift ? `${shift.label} · ${shift.date} · ${shift.start_time} - ${shift.end_time}` : "Shift details unavailable"}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Status: {request.status}</div>
                  {request.reason ? (
                    <div className="mt-2 text-sm text-slate-700">Reason: {request.reason}</div>
                  ) : null}

                  {request.status === "pending" && assignment ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        onClick={() => void reviewRequest(request.id, assignment.id, "approved")}
                        disabled={workingId === request.id}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => void reviewRequest(request.id, assignment.id, "denied")}
                        disabled={workingId === request.id}
                      >
                        Deny
                      </Button>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
