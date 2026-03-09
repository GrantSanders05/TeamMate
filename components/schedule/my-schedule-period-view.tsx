"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

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
}

type Assignment = {
  id: string
  shift_id: string
  employee_id: string | null
  status: string
  shifts: Shift | null
}

type DropRequest = {
  id: string
  assignment_id: string
  status: "pending" | "approved" | "denied"
  reason: string | null
}

export function MySchedulePeriodView({ periodId }: { periodId: string }) {
  const supabase = createClient()
  const { organization, member, isLoading } = useOrgSafe()

  const [period, setPeriod] = useState<Period | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [dropRequests, setDropRequests] = useState<Record<string, DropRequest>>({})
  const [loading, setLoading] = useState(true)
  const [reasonByAssignment, setReasonByAssignment] = useState<Record<string, string>>({})
  const [submittingId, setSubmittingId] = useState<string | null>(null)

  async function loadData() {
    if (!organization || !member) {
      setLoading(false)
      return
    }

    setLoading(true)

    const { data: periodData } = await supabase
      .from("scheduling_periods")
      .select("id, name, start_date, end_date, status")
      .eq("id", periodId)
      .eq("organization_id", organization.id)
      .single()

    setPeriod((periodData as Period) || null)

    const { data: shiftData } = await supabase
      .from("shifts")
      .select("id, date, label, start_time, end_time, required_workers")
      .eq("scheduling_period_id", periodId)
      .order("date", { ascending: true })
      .order("start_time", { ascending: true })

    const shiftMap = Object.fromEntries((((shiftData as Shift[]) || []).map((s) => [s.id, s])))

    const shiftIds = (((shiftData as Shift[]) || []).map((s) => s.id))
    if (shiftIds.length === 0) {
      setAssignments([])
      setDropRequests({})
      setLoading(false)
      return
    }

    const { data: assignmentData } = await supabase
      .from("shift_assignments")
      .select("id, shift_id, employee_id, status")
      .eq("employee_id", member.user_id)
      .in("shift_id", shiftIds)
      .order("assigned_at", { ascending: true })

    const normalizedAssignments = (((assignmentData as { id: string; shift_id: string; employee_id: string | null; status: string }[]) || []).map((row) => ({
      id: row.id,
      shift_id: row.shift_id,
      employee_id: row.employee_id,
      status: row.status,
      shifts: shiftMap[row.shift_id] || null,
    })))

    setAssignments(normalizedAssignments)

    const assignmentIds = normalizedAssignments.map((a) => a.id)
    if (assignmentIds.length > 0) {
      const { data: requestData } = await supabase
        .from("drop_requests")
        .select("id, assignment_id, status, reason")
        .in("assignment_id", assignmentIds)

      const mapped = Object.fromEntries(
        (((requestData as DropRequest[]) || []).map((r) => [r.assignment_id, r]))
      )
      setDropRequests(mapped)
    } else {
      setDropRequests({})
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadData()
  }, [organization?.id, member?.user_id, periodId])

  async function requestDrop(assignmentId: string) {
    if (!member?.user_id) return

    if (dropRequests[assignmentId]?.status === "pending") {
      alert("A drop request is already pending for this shift.")
      return
    }

    setSubmittingId(assignmentId)

    const { error } = await supabase.from("drop_requests").insert({
      assignment_id: assignmentId,
      requested_by: member.user_id,
      reason: reasonByAssignment[assignmentId] || null,
      status: "pending",
    })

    setSubmittingId(null)

    if (error) {
      alert(error.message)
      return
    }

    await loadData()
  }

  if (isLoading || loading) {
    return <div className="rounded-lg border bg-white p-6">Loading your schedule...</div>
  }

  if (!organization || !member) {
    return <div className="rounded-lg border bg-white p-6">No active organization selected.</div>
  }

  if (!period) {
    return <div className="rounded-lg border bg-white p-6">Published schedule not found.</div>
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-white p-6">
        <h1 className="text-2xl font-semibold">{period.name}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {period.start_date} → {period.end_date} · Status: {period.status}
        </p>
      </div>

      <div className="rounded-lg border bg-white p-6">
        {assignments.length === 0 ? (
          <div className="text-sm text-slate-600">You do not have any assigned shifts in this period.</div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const request = dropRequests[assignment.id]
              return (
                <div key={assignment.id} className="rounded-lg border p-4">
                  <div className="font-medium text-slate-900">{assignment.shifts?.label || "Shift"}</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {assignment.shifts?.date} · {assignment.shifts?.start_time} - {assignment.shifts?.end_time}
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Assignment status: {assignment.status}
                  </div>

                  {request ? (
                    <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-sm text-slate-700">
                      Drop request status: <strong>{request.status}</strong>
                      {request.reason ? <div className="mt-1 text-xs text-slate-500">Reason: {request.reason}</div> : null}
                    </div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder="Optional reason for dropping this shift"
                        value={reasonByAssignment[assignment.id] || ""}
                        onChange={(e) =>
                          setReasonByAssignment((prev) => ({
                            ...prev,
                            [assignment.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        variant="outline"
                        onClick={() => void requestDrop(assignment.id)}
                        disabled={submittingId === assignment.id}
                      >
                        {submittingId === assignment.id ? "Submitting..." : "Request Drop"}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
