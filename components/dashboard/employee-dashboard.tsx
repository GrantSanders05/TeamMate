"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Layers3,
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

function calculateHours(start: string, end: string) {
  const [startH, startM] = start.split(":").map(Number)
  const [endH, endM] = end.split(":").map(Number)

  const startMinutes = startH * 60 + startM
  let endMinutes = endH * 60 + endM

  if (endMinutes < startMinutes) endMinutes += 24 * 60

  return (endMinutes - startMinutes) / 60
}

function formatHours(hours: number) {
  const rounded = Math.round(hours * 10) / 10
  return Number.isInteger(rounded) ? `${rounded.toFixed(0)} hrs` : `${rounded.toFixed(1)} hrs`
}

function DashboardStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-base font-semibold text-slate-900">{value}</div>
    </div>
  )
}

function DashboardActionCard({
  eyebrow,
  title,
  description,
  href,
  buttonLabel,
  icon,
  tone = "blue",
}: {
  eyebrow: string
  title: string
  description: string
  href: string
  buttonLabel: string
  icon: React.ReactNode
  tone?: "blue" | "emerald"
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70"
      : "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-100/70"

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            {eyebrow}
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="rounded-2xl bg-white/85 p-2.5 text-slate-700 shadow-sm">{icon}</div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>

      <Button asChild className="mt-5 w-full justify-between" size="lg">
        <Link href={href}>
          {buttonLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
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

  const latestPublished = useMemo(() => publishedPeriods[0] || null, [publishedPeriods])
  const nextShift = useMemo(() => myShifts[0] || null, [myShifts])

  const availabilityHref = collectingPeriods[0]
    ? `/availability/${collectingPeriods[0].id}`
    : "/availability"

  const scheduleHref = latestPublished
    ? `/my-schedule/${latestPublished.id}`
    : nextShift
      ? `/my-schedule/${nextShift.period_id}`
      : "/my-schedule"

  const shiftsInLatestPublished = useMemo(() => {
    if (!latestPublished) return []
    return myShifts.filter((shift) => shift.period_id === latestPublished.id)
  }, [latestPublished, myShifts])

  const latestPublishedHours = useMemo(
    () =>
      shiftsInLatestPublished.reduce(
        (total, shift) => total + calculateHours(shift.start_time, shift.end_time),
        0,
      ),
    [shiftsInLatestPublished],
  )

  if (!organization) {
    return <div className="p-6 text-sm text-slate-600">No organization selected.</div>
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading dashboard...</div>
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="Your schedule, availability, and next shift all in one place."
      className="space-y-6"
    >
      <SectionCard className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <div className="flex-1 space-y-4">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Employee overview
                </div>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
                  {nextShift
                    ? `Next up: ${nextShift.label}`
                    : collectingPeriods.length > 0
                      ? "Availability needs your attention"
                      : "You’re all caught up"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {nextShift
                    ? `${formatDate(nextShift.date)} • ${formatTimeRange(nextShift.start_time, nextShift.end_time)}`
                    : collectingPeriods.length > 0
                      ? `${collectingPeriods[0].name} is open right now. Submit availability so your manager can build the schedule.`
                      : "Use the quick links below to review your posted schedule or update your availability when a new period opens."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <DashboardStat
                  label="Availability"
                  value={
                    collectingPeriods.length > 0
                      ? `${collectingPeriods.length} open`
                      : "Caught up"
                  }
                />
                <DashboardStat
                  label="Next shift"
                  value={nextShift ? formatDate(nextShift.date) : "Not assigned"}
                />
                <DashboardStat
                  label="Published shifts"
                  value={`${shiftsInLatestPublished.length}`}
                />
                <DashboardStat
                  label="Expected hours"
                  value={formatHours(latestPublishedHours)}
                />
              </div>
            </div>

            <div className="grid flex-1 gap-4 md:grid-cols-2 xl:max-w-[640px]">
              <DashboardActionCard
                eyebrow={collectingPeriods.length > 0 ? "Availability needed" : "Availability"}
                title={
                  collectingPeriods.length > 0
                    ? "Submit availability"
                    : "Availability is up to date"
                }
                description={
                  collectingPeriods.length > 0
                    ? "Go straight to the active form so your manager sees your availability right away."
                    : "There are no open periods right now, but you can still review your availability page."
                }
                href={availabilityHref}
                buttonLabel={collectingPeriods.length > 0 ? "Open form" : "Open availability"}
                icon={<ClipboardCheck className="h-5 w-5" />}
                tone="emerald"
              />

              <DashboardActionCard
                eyebrow="My schedule"
                title={latestPublished ? latestPublished.name : "View my schedule"}
                description={
                  nextShift
                    ? `Your next shift is ${formatDate(nextShift.date)} at ${formatTimeRange(nextShift.start_time, nextShift.end_time)}.`
                    : "Jump straight into the latest posted schedule and see where you work next."
                }
                href={scheduleHref}
                buttonLabel="Open schedule"
                icon={<CalendarClock className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <SectionCard
          title="Upcoming shifts"
          description="Your next few assigned shifts from published schedules."
          className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
        >
          {myShifts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
              You do not have any assigned shifts in a published schedule yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myShifts.slice(0, 5).map((shift, index) => (
                <div
                  key={shift.shift_id}
                  className={`rounded-2xl border px-4 py-4 shadow-sm ${
                    index === 0
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{shift.label}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {formatDate(shift.date)} • {formatTimeRange(shift.start_time, shift.end_time)}
                      </div>
                      <div className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {shift.period_name}
                      </div>
                    </div>

                    <Button asChild variant="outline" className="sm:self-start">
                      <Link href={`/my-schedule/${shift.period_id}`}>Open schedule</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Open availability periods"
            description="Respond to any period your manager still needs from you."
            className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
          >
            {collectingPeriods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-8 text-sm text-slate-500">
                You are caught up on availability right now.
              </div>
            ) : (
              <div className="space-y-3">
                {collectingPeriods.map((period) => (
                  <div
                    key={period.id}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/60 px-4 py-4 shadow-sm"
                  >
                    <div className="text-sm font-semibold text-slate-900">{period.name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {formatDate(period.start_date)} – {formatDate(period.end_date)}
                    </div>
                    <Button asChild className="mt-4 w-full" variant="outline">
                      <Link href={`/availability/${period.id}`}>Open form</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Current published schedule"
            description="Your totals for the most recent published period."
            className="rounded-[28px] border border-slate-200 bg-white shadow-sm"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <DashboardStat
                label="Schedule"
                value={latestPublished?.name || "No published period"}
              />
              <DashboardStat
                label="Expected hours"
                value={formatHours(latestPublishedHours)}
              />
              <DashboardStat
                label="Shift count"
                value={`${shiftsInLatestPublished.length}`}
              />
              <DashboardStat
                label="Next shift time"
                value={nextShift ? formatTimeRange(nextShift.start_time, nextShift.end_time) : "—"}
              />
            </div>

            <Button asChild className="mt-4 w-full" variant="outline">
              <Link href={scheduleHref}>Go to my schedule</Link>
            </Button>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}

export default EmployeeDashboard
