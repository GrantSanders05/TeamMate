"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type Shift = {
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
  display_name: string | null
}

type PeriodRecord = {
  id: string
  name: string
  start_date: string
  end_date: string
}

function formatRange(start: string, end: string) {
  const clean = (value: string) => value?.slice(0, 5) ?? value
  return `${clean(start)} – ${clean(end)}`
}

function formatDateLabel(value: string) {
  try {
    return new Date(value).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  } catch {
    return value
  }
}

export function MySchedulePeriodView({ periodId }: { periodId: string }) {
  const supabase = useMemo(() => createClient(), [])
  const { organization } = useOrgSafe()
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<PeriodRecord | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [members, setMembers] = useState<Member[]>([])

  useEffect(() => {
    async function loadData() {
      if (!organization?.id || !periodId) {
        setLoading(false)
        return
      }

      setLoading(true)

      const [{ data: periodData }, { data: shiftData }, { data: memberData }] = await Promise.all([
        supabase
          .from("scheduling_periods")
          .select("id, name, start_date, end_date")
          .eq("id", periodId)
          .eq("organization_id", organization.id)
          .maybeSingle(),
        supabase
          .from("shifts")
          .select("id, date, label, start_time, end_time")
          .eq("scheduling_period_id", periodId)
          .order("date", { ascending: true })
          .order("start_time", { ascending: true }),
        supabase
          .from("organization_members")
          .select("user_id, display_name")
          .eq("organization_id", organization.id)
          .eq("is_active", true),
      ])

      const shiftIds = ((shiftData as Shift[]) || []).map((shift) => shift.id)

      let assignmentData: Assignment[] = []
      if (shiftIds.length > 0) {
        const { data } = await supabase
          .from("shift_assignments")
          .select("id, shift_id, employee_id, manual_name, status")
          .in("shift_id", shiftIds)
          .neq("status", "dropped")

        assignmentData = (data as Assignment[]) || []
      }

      setPeriod((periodData as PeriodRecord | null) ?? null)
      setShifts((shiftData as Shift[]) || [])
      setAssignments(assignmentData)
      setMembers((memberData as Member[]) || [])
      setLoading(false)
    }

    void loadData()
  }, [organization?.id, periodId, supabase])

  const grouped = shifts.reduce<Record<string, Shift[]>>((acc, shift) => {
    if (!acc[shift.date]) acc[shift.date] = []
    acc[shift.date].push(shift)
    return acc
  }, {})

  return (
    <PageShell
      title={period?.name || "Schedule"}
      subtitle={period ? `${period.start_date} – ${period.end_date}` : "Published schedule"}
    >
      {!organization ? (
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      ) : loading ? (
        <SectionCard>
          <p className="text-sm text-slate-600">Loading schedule...</p>
        </SectionCard>
      ) : shifts.length === 0 ? (
        <SectionCard>
          <p className="text-sm text-slate-600">No shifts were found for this published period.</p>
        </SectionCard>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {Object.entries(grouped).map(([date, dateShifts]) => (
            <SectionCard key={date} title={formatDateLabel(date)}>
              <div className="space-y-3">
                {dateShifts.map((shift) => {
                  const shiftAssignments = assignments.filter((item) => item.shift_id === shift.id)
                  return (
                    <div key={shift.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-semibold text-slate-900">{shift.label}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {formatRange(shift.start_time, shift.end_time)}
                      </div>

                      <div className="mt-3 space-y-2">
                        {shiftAssignments.length === 0 ? (
                          <div className="text-xs text-slate-500">No one assigned yet.</div>
                        ) : (
                          shiftAssignments.map((assignment) => {
                            const member = members.find((item) => item.user_id === assignment.employee_id)
                            const displayName = member?.display_name || assignment.manual_name || "Assigned"
                            return (
                              <div
                                key={assignment.id}
                                className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm"
                              >
                                {displayName}
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </PageShell>
  )
}

export default MySchedulePeriodView
