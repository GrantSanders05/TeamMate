"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { CalendarClock, ChevronRight, Clock3, UserCircle2 } from "lucide-react"

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

type Shift = {
  id: string
  scheduling_period_id: string
  date: string
  label: string
  start_time: string
  end_time: string
  color?: string | null
}

type Assignment = {
  id: string
  shift_id: string
  employee_id: string | null
  status: string
}

type NextShiftSummary = {
  periodId: string
  periodName: string
  date: string
  label: string
  start_time: string
  end_time: string
  color?: string | null
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRange(start: string, end: string) {
  const clean = (value: string) => {
    const [hourRaw, minute = "00"] = value.split(":")
    const hour = Number(hourRaw)
    const suffix = hour >= 12 ? "PM" : "AM"
    const normalized = hour % 12 || 12
    return `${normalized}:${minute.slice(0, 2)} ${suffix}`
  }

  return `${clean(start)} – ${clean(end)}`
}

function shiftStartsAt(dateValue: string, timeValue: string) {
  return new Date(`${dateValue}T${timeValue}`)
}

export function MyScheduleHome() {
  const supabase = createClient()
  const { organization } = useOrgSafe()

  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [nextShift, setNextShift] = useState<NextShiftSummary | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadPeriods() {
      if (!organization) {
        if (mounted) setLoading(false)
        return
      }

      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .eq("status", "published")
        .order("start_date", { ascending: false })

      const publishedPeriods = (data as Period[]) || []

      if (user?.id && publishedPeriods.length > 0) {
        const periodIds = publishedPeriods.map((period) => period.id)

        const { data: shiftData } = await supabase
          .from("shifts")
          .select("id, scheduling_period_id, date, label, start_time, end_time, color")
          .in("scheduling_period_id", periodIds)

        const shifts = (shiftData as Shift[]) || []

        if (shifts.length > 0) {
          const shiftIds = shifts.map((shift) => shift.id)

          const { data: assignmentData } = await supabase
            .from("shift_assignments")
            .select("id, shift_id, employee_id, status")
            .eq("employee_id", user.id)
            .in("shift_id", shiftIds)
            .neq("status", "dropped")

          const assignments = (assignmentData as Assignment[]) || []
          const futureShift = shifts
            .filter((shift) =>
              assignments.some((assignment) => assignment.shift_id === shift.id && assignment.status === "assigned")
            )
            .filter((shift) => shiftStartsAt(shift.date, shift.start_time).getTime() >= Date.now())
            .sort(
              (a, b) =>
                shiftStartsAt(a.date, a.start_time).getTime() - shiftStartsAt(b.date, b.start_time).getTime()
            )[0]

          if (futureShift) {
            const parentPeriod = publishedPeriods.find((period) => period.id === futureShift.scheduling_period_id)
            if (parentPeriod) {
              setNextShift({
                periodId: parentPeriod.id,
                periodName: parentPeriod.name,
                date: futureShift.date,
                label: futureShift.label,
                start_time: futureShift.start_time,
                end_time: futureShift.end_time,
                color: futureShift.color,
              })
            } else {
              setNextShift(null)
            }
          } else {
            setNextShift(null)
          }
        } else {
          setNextShift(null)
        }
      } else {
        setNextShift(null)
      }

      if (!mounted) return

      setPeriods(publishedPeriods)
      setLoading(false)
    }

    void loadPeriods()

    return () => {
      mounted = false
    }
  }, [organization?.id])

  const latestPeriod = useMemo(() => periods[0] || null, [periods])

  if (!organization) {
    return (
      <PageShell title="My Schedule" subtitle="Check your next shift and your published schedule periods.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell title="My Schedule" subtitle="Built for quick mobile check-ins and fast access to your next shift.">
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <SectionCard className="overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-700 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                Next Up
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                {nextShift ? nextShift.label : "No upcoming shift"}
              </h2>
              <p className="mt-2 max-w-xl text-sm text-blue-50/90">
                {nextShift
                  ? `${formatDate(nextShift.date)} · ${formatRange(nextShift.start_time, nextShift.end_time)}`
                  : "You do not have a future assigned shift in a published period yet."}
              </p>
            </div>
            <div
              className="hidden h-12 w-12 shrink-0 rounded-2xl border border-white/15 bg-white/10 md:flex md:items-center md:justify-center"
              style={{ boxShadow: nextShift?.color ? `inset 0 0 0 1px ${nextShift.color}` : undefined }}
            >
              <CalendarClock className="h-6 w-6 text-white" />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {nextShift ? (
              <Button asChild className="h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                <Link href={`/my-schedule/${nextShift.periodId}`}>Open Next Shift</Link>
              </Button>
            ) : (
              <Button asChild className="h-12 rounded-2xl bg-white text-slate-900 hover:bg-slate-100">
                <Link href={latestPeriod ? `/my-schedule/${latestPeriod.id}` : "/my-schedule"}>Open Latest Schedule</Link>
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              className="h-12 rounded-2xl border-white/20 bg-white/10 text-white hover:bg-white/15"
            >
              <Link href="/availability">Submit Availability</Link>
            </Button>
          </div>

          {nextShift ? (
            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                Quick Summary
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/70">Date</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatDate(nextShift.date)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/70">Time</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {formatRange(nextShift.start_time, nextShift.end_time)}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.16em] text-blue-100/70">Period</p>
                  <p className="mt-1 text-sm font-semibold text-white">{nextShift.periodName}</p>
                </div>
              </div>
            </div>
          ) : null}
        </SectionCard>

        <SectionCard className="bg-white">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
          <div className="mt-4 grid gap-3">
            <Link
              href="/my-schedule"
              className="flex min-h-[64px] items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <Clock3 className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Published Schedules</p>
                  <p className="text-sm text-slate-500">Jump back into your current periods</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>

            <Link
              href="/availability"
              className="flex min-h-[64px] items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <CalendarClock className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Availability</p>
                  <p className="text-sm text-slate-500">Update when you can work next</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>

            <Link
              href="/profile"
              className="flex min-h-[64px] items-center justify-between rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 shadow-sm">
                  <UserCircle2 className="h-5 w-5 text-slate-700" />
                </div>
                <div>
                  <p className="font-medium text-slate-900">Profile</p>
                  <p className="text-sm text-slate-500">Keep your account details updated</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400" />
            </Link>
          </div>
        </SectionCard>
      </div>

      <SectionCard>
        {loading ? (
          <p className="text-sm text-slate-500">Loading schedules…</p>
        ) : periods.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-medium text-slate-900">No published schedules yet.</p>
            <p className="mt-1 text-sm text-slate-500">
              Your manager has not published a schedule for this organization yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {periods.map((period, index) => (
              <Link
                key={period.id}
                href={`/my-schedule/${period.id}`}
                className="block rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {index === 0 ? "Latest Published" : "Published Period"}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-slate-900">{period.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(period.start_date)} – {formatDate(period.end_date)}
                    </p>
                  </div>
                  <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-slate-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
