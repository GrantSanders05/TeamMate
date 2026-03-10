"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronRight,
  Clock3,
  CalendarClock,
  UserCircle2,
} from "lucide-react"
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

      const collecting = ((periodsData as Period[]) || []).filter((period) => period.status === "collecting")
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

          const assignedShiftIds = new Set((assignmentData || []).map((assignment: any) => assignment.shift_id))

          loadedShifts = (shiftsData || [])
            .filter((shift: any) => assignedShiftIds.has(shift.id))
            .map((shift: any) => {
              const period = published.find((item) => item.id === shift.scheduling_period_id)

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
    return (
      <PageShell title="Dashboard" subtitle="Your scheduling home base.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell title="Dashboard" subtitle="Your scheduling home base.">
        <SectionCard>
          <p className="text-sm text-slate-600">Loading dashboard...</p>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="Your scheduling home base for quick check-ins and fast access to what matters most."
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="overflow-hidden rounded-[32px] border border-slate-900/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-700 p-5 text-white shadow-xl md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200">Next Up</p>
              <h2 className="mt-4 text-3xl font-semibold leading-tight">
                {nextShift ? nextShift.label : "No upcoming shift"}
              </h2>
              <p className="mt-3 text-base text-blue-50/90">
                {nextShift
                  ? `${formatDate(nextShift.date)} · ${formatTimeRange(nextShift.start_time, nextShift.end_time)}`
                  : "You are all caught up right now."}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-300/40 bg-white/5 p-3">
              <CalendarClock className="h-7 w-7 text-blue-100" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <Button
              asChild
              className="h-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-100"
            >
              <Link href={nextShift ? `/my-schedule/${nextShift.period_id}` : "/my-schedule"}>
                {nextShift ? "Open Next Shift" : "Open My Schedule"}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              <Link href="/availability">Submit Availability</Link>
            </Button>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-100">Quick Summary</p>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Date</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {nextShift ? formatDate(nextShift.date) : "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Time</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {nextShift ? formatTimeRange(nextShift.start_time, nextShift.end_time) : "—"}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-100">Period</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {nextShift ? nextShift.period_name : latestPublished?.name || "No period"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <SectionCard>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Quick Actions</p>

          <div className="mt-5 space-y-3">
            <Link
              href="/my-schedule"
              className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full border border-slate-200 bg-white p-2.5">
                  <Clock3 className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Published Schedules</p>
                  <p className="text-sm text-slate-600">Jump back into your current periods</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-700" />
            </Link>

            <Link
              href="/availability"
              className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full border border-slate-200 bg-white p-2.5">
                  <CalendarClock className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Availability</p>
                  <p className="text-sm text-slate-600">Update when you can work next</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-700" />
            </Link>

            <Link
              href="/profile"
              className="group flex items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full border border-slate-200 bg-white p-2.5">
                  <UserCircle2 className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">Profile</p>
                  <p className="text-sm text-slate-600">Keep your account details updated</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:text-slate-700" />
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Latest Published
            </div>

            <h3 className="mt-4 text-2xl font-semibold text-slate-900">
              {latestPublished?.name || "No published schedule"}
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              {latestPublished
                ? `${formatDate(latestPublished.start_date)} – ${formatDate(latestPublished.end_date)}`
                : "Once your manager publishes a schedule, it will show up here."}
            </p>
          </div>

          {latestPublished ? (
            <Button asChild className="hidden md:inline-flex">
              <Link href={`/my-schedule/${latestPublished.id}`}>Open Schedule</Link>
            </Button>
          ) : null}
        </div>

        {collectingPeriods.length > 0 ? (
          <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">Availability Needed</p>
            <p className="mt-1 text-sm text-amber-800">
              {collectingPeriods.length} period{collectingPeriods.length === 1 ? "" : "s"} currently need your availability.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {collectingPeriods.slice(0, 3).map((period) => (
                <div
                  key={period.id}
                  className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800"
                >
                  {period.name}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Button asChild variant="outline">
                <Link href="/availability">Submit Availability</Link>
              </Button>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </PageShell>
  )
}

export default EmployeeDashboard
