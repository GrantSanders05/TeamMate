"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarClock, Clock3, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

type MyShift = {
  shift_id: string
  label: string
  date: string
  start_time: string
  end_time: string
  period_id: string
  period_name: string
}

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTimeRange(start: string, end: string) {
  const clean = (value: string) => {
    const [hourRaw, minute = "00"] = value.split(":")
    const hour = Number(hourRaw)
    const suffix = hour >= 12 ? "PM" : "AM"
    const normalized = hour % 12 || 12
    return `${normalized}:${minute.slice(0, 2)} ${suffix}`
  }

  return `${clean(start)} – ${clean(end)}`
}

function OverviewCard({
  label,
  value,
  helper,
}: {
  label: string
  value: string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

export function EmployeeDashboard() {
  const supabase = createClient()
  const { organization, member } = useOrgSafe()
  const [collectingPeriods, setCollectingPeriods] = useState<Period[]>([])
  const [publishedPeriods, setPublishedPeriods] = useState<Period[]>([])
  const [myShifts, setMyShifts] = useState<MyShift[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      if (!organization || !member?.user_id) {
        setLoading(false)
        return
      }

      const { data: periodsData } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .in("status", ["collecting", "published"])
        .order("start_date", { ascending: true })

      const collecting = ((periodsData as Period[]) || []).filter(
        (period) => period.status === "collecting",
      )
      const published = ((periodsData as Period[]) || [])
        .filter((period) => period.status === "published")
        .sort((a, b) => `${b.start_date}`.localeCompare(`${a.start_date}`))

      let loadedShifts: MyShift[] = []

      if (published.length > 0) {
        const publishedIds = published.map((period) => period.id)
        const { data: shiftsData } = await supabase
          .from("shifts")
          .select("id, label, date, start_time, end_time, scheduling_period_id")
          .in("scheduling_period_id", publishedIds)

        const shiftIds = (shiftsData || []).map((shift: any) => shift.id)

        if (shiftIds.length > 0) {
          const { data: assignmentData } = await supabase
            .from("shift_assignments")
            .select("shift_id, employee_id, status")
            .eq("employee_id", member.user_id)
            .eq("status", "assigned")
            .in("shift_id", shiftIds)

          const assignedShiftIds = new Set(
            (assignmentData || []).map((assignment: any) => assignment.shift_id),
          )

          loadedShifts = (shiftsData || [])
            .filter((shift: any) => assignedShiftIds.has(shift.id))
            .map((shift: any) => {
              const period = published.find(
                (item) => item.id === shift.scheduling_period_id,
              )

              return {
                shift_id: shift.id,
                label: shift.label,
                date: shift.date,
                start_time: shift.start_time,
                end_time: shift.end_time,
                period_id: shift.scheduling_period_id,
                period_name: period?.name || "Published Period",
              }
            })
            .sort((a, b) => `${a.date} ${a.start_time}`.localeCompare(`${b.date} ${b.start_time}`))
        }
      }

      setCollectingPeriods(collecting)
      setPublishedPeriods(published)
      setMyShifts(loadedShifts)
      setLoading(false)
    }

    void loadDashboard()
  }, [organization?.id, member?.user_id, supabase])

  const nextShift = useMemo(() => myShifts[0] || null, [myShifts])
  const latestPublished = useMemo(() => publishedPeriods[0] || null, [publishedPeriods])

  if (!organization) {
    return <div className="text-sm text-slate-500">No organization selected.</div>
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading dashboard...</div>
  }

  return (
    <PageShell
      title="My Dashboard"
      subtitle={organization.name}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/my-schedule">My Schedule</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/availability">Submit Availability</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            label="Next Shift"
            value={nextShift ? nextShift.label : "No upcoming shift"}
            helper={nextShift ? formatDate(nextShift.date) : "You are all caught up."}
          />
          <OverviewCard
            label="Shift Time"
            value={nextShift ? formatTimeRange(nextShift.start_time, nextShift.end_time) : "—"}
            helper={nextShift ? nextShift.period_name : "No published shift assigned."}
          />
          <OverviewCard
            label="Availability"
            value={`${collectingPeriods.length}`}
            helper={
              collectingPeriods.length === 1
                ? "Period needs your availability."
                : "Periods need your availability."
            }
          />
          <OverviewCard
            label="Published"
            value={`${publishedPeriods.length}`}
            helper={
              publishedPeriods.length === 1
                ? "Published schedule is live."
                : "Published schedules are live."
            }
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <SectionCard title="Upcoming Shifts" className="shadow-sm">
            {myShifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                You do not have any assigned shifts in a published schedule yet.
              </div>
            ) : (
              <div className="space-y-3">
                {myShifts.slice(0, 6).map((shift) => (
                  <div
                    key={shift.shift_id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">
                          {shift.label}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(shift.date)} · {formatTimeRange(shift.start_time, shift.end_time)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">{shift.period_name}</p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/my-schedule">Open Schedule</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Quick Actions" className="shadow-sm">
              <div className="grid gap-3">
                <Link
                  href="/my-schedule"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <CalendarClock className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">My Schedule</p>
                    <p className="text-sm text-slate-500">See published shifts and teammates</p>
                  </div>
                </Link>

                <Link
                  href="/availability"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Clock3 className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Availability</p>
                    <p className="text-sm text-slate-500">Update when you can work next</p>
                  </div>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <UserCircle2 className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-900">Profile</p>
                    <p className="text-sm text-slate-500">Keep your account details updated</p>
                  </div>
                </Link>
              </div>
            </SectionCard>

            <SectionCard title="Current Status" className="shadow-sm">
              <div className="space-y-3 text-sm text-slate-500">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="font-medium text-slate-900">Latest Published Period</p>
                  <p className="mt-1">
                    {latestPublished
                      ? `${latestPublished.name} · ${formatDate(latestPublished.start_date)} – ${formatDate(latestPublished.end_date)}`
                      : "No published schedule is available yet."}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="font-medium text-slate-900">Availability Needed</p>
                  <p className="mt-1">
                    {collectingPeriods.length === 0
                      ? "You are caught up on availability right now."
                      : `${collectingPeriods.length} period${collectingPeriods.length === 1 ? "" : "s"} currently need your availability.`}
                  </p>
                </div>
                {collectingPeriods.length > 0 ? (
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-wrap gap-2">
                      {collectingPeriods.slice(0, 4).map((period) => (
                        <span
                          key={period.id}
                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700"
                        >
                          {period.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default EmployeeDashboard
