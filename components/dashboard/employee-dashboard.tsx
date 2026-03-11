"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarClock, ChevronRight, Clock3, UserCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { createClient } from "@/lib/supabase/client"

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
  }, [member?.user_id, organization?.id, supabase])

  const nextShift = useMemo(() => myShifts[0] || null, [myShifts])
  const latestPublished = useMemo(() => publishedPeriods[0] || null, [publishedPeriods])

  if (!organization) {
    return (
      <PageShell title="Dashboard" subtitle="No organization selected yet.">
        <SectionCard title="Organization Required" description="Join or select an organization to see your dashboard.">
          <p className="text-sm text-slate-600">Once you are active in an organization, your shifts and availability periods will show up here.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell title="Employee Dashboard" subtitle="Loading your schedule and availability details...">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 rounded-[28px] border border-slate-200 bg-white animate-pulse" />
          ))}
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Employee Dashboard"
      subtitle="See what is coming up next, check published periods, and jump into availability faster."
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/my-schedule">Open My Schedule</Link>
          </Button>
          <Button asChild>
            <Link href="/availability">Submit Availability</Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <section className="brand-panel p-5 sm:p-6">
          <div className="pill-badge mb-4">
            <CalendarClock className="h-3.5 w-3.5" />
            Next Up
          </div>

          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            {nextShift ? nextShift.label : "No upcoming shift"}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            {nextShift
              ? `${formatDate(nextShift.date)} · ${formatTimeRange(nextShift.start_time, nextShift.end_time)}`
              : "You are all caught up right now. When your next shift is assigned, it will appear here."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/my-schedule">
                {nextShift ? "Open Next Shift" : "Open My Schedule"}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>

            <Button asChild variant="outline">
              <Link href="/availability">Submit Availability</Link>
            </Button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[22px] border border-white/80 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Date</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {nextShift ? formatDate(nextShift.date) : "—"}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Time</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {nextShift ? formatTimeRange(nextShift.start_time, nextShift.end_time) : "—"}
              </p>
            </div>
            <div className="rounded-[22px] border border-white/80 bg-white/80 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Period</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {nextShift ? nextShift.period_name : latestPublished?.name || "No period"}
              </p>
            </div>
          </div>
        </section>

        <SectionCard
          description="Quick links for the actions employees use most."
          title="Quick Actions"
        >
          <div className="grid gap-3">
            <Link
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              href="/my-schedule"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Published Schedules</p>
                  <p className="text-sm text-slate-600">Jump back into your current periods.</p>
                </div>
              </div>
            </Link>

            <Link
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              href="/availability"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <Clock3 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Availability</p>
                  <p className="text-sm text-slate-600">Update when you can work next.</p>
                </div>
              </div>
            </Link>

            <Link
              className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              href="/profile"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                  <UserCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-950">Profile</p>
                  <p className="text-sm text-slate-600">Keep your account details updated.</p>
                </div>
              </div>
            </Link>
          </div>
        </SectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SectionCard
          description="Your latest published period appears here first so you can jump back in quickly."
          title="Latest Published"
        >
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="text-xl font-semibold tracking-tight text-slate-950">
              {latestPublished?.name || "No published schedule"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {latestPublished
                ? `${formatDate(latestPublished.start_date)} – ${formatDate(latestPublished.end_date)}`
                : "Once your manager publishes a schedule, it will show up here."}
            </p>

            {latestPublished ? (
              <div className="mt-4">
                <Button asChild variant="outline">
                  <Link href="/my-schedule">Open Schedule</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          description="Periods that still need your availability will stay visible here."
          title="Availability Needed"
        >
          {collectingPeriods.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-slate-600">
                {collectingPeriods.length} period{collectingPeriods.length === 1 ? "" : "s"} currently need your availability.
              </p>

              {collectingPeriods.slice(0, 3).map((period) => (
                <div
                  key={period.id}
                  className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-slate-950">{period.name}</p>
                    <p className="text-sm text-slate-600">
                      {formatDate(period.start_date)} – {formatDate(period.end_date)}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-amber-800">
                    Collecting
                  </span>
                </div>
              ))}

              <div className="pt-1">
                <Button asChild>
                  <Link href="/availability">Submit Availability</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No open periods need your availability right now.
            </div>
          )}
        </SectionCard>
      </div>
    </PageShell>
  )
}

export default EmployeeDashboard
