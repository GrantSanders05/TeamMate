"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  ClipboardCheck,
  Clock3,
  Layers3,
  Sparkles,
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

function ActionCard({
  eyebrow,
  title,
  body,
  href,
  buttonLabel,
  icon,
  tone = "blue",
  footer,
}: {
  eyebrow: string
  title: string
  body: string
  href: string
  buttonLabel: string
  icon: React.ReactNode
  tone?: "blue" | "emerald" | "slate"
  footer?: React.ReactNode
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70"
      : tone === "slate"
        ? "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/70"
        : "border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-100/70"

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
            {eyebrow}
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-2 text-slate-700 shadow-sm">
          {icon}
        </div>
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>

      {footer ? <div className="mt-4 grid grid-cols-2 gap-2">{footer}</div> : null}

      <Button asChild size="lg" className="mt-4 w-full rounded-2xl">
        <Link href={href}>
          {buttonLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 px-3 py-2 shadow-sm">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  )
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
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <p className="mt-1 text-sm text-slate-600">{helper}</p>
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
    () => shiftsInLatestPublished.reduce((total, shift) => total + calculateHours(shift.start_time, shift.end_time), 0),
    [shiftsInLatestPublished],
  )

  if (!organization) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">No organization selected.</div>
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">Loading dashboard...</div>
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="See what needs your attention first and jump straight into it."
      className="space-y-5"
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <ActionCard
          eyebrow={collectingPeriods.length > 0 ? "Availability needed" : "Availability"}
          title={
            collectingPeriods.length > 0
              ? `${collectingPeriods.length} open period${collectingPeriods.length === 1 ? "" : "s"}`
              : "You are caught up"
          }
          body={
            collectingPeriods.length > 0
              ? `Complete ${collectingPeriods[0].name} so your manager can build the schedule.`
              : "There are no active availability forms right now."
          }
          href={availabilityHref}
          buttonLabel={collectingPeriods.length > 0 ? "Open Availability Form" : "Open Availability"}
          icon={<ClipboardCheck className="h-5 w-5" />}
          tone="emerald"
          footer={
            <>
              <StatPill
                label="Open forms"
                value={`${collectingPeriods.length}`}
              />
              <StatPill
                label="Next action"
                value={collectingPeriods[0] ? "Respond now" : "None needed"}
              />
            </>
          }
        />

        <ActionCard
          eyebrow={latestPublished ? "My schedule" : "Schedule"}
          title={latestPublished ? latestPublished.name : "No posted schedule"}
          body={
            latestPublished
              ? "Open your posted schedule, check assigned shifts, and see what your week looks like."
              : "Your schedule card will light up here as soon as a manager publishes it."
          }
          href={scheduleHref}
          buttonLabel={latestPublished ? "Open My Schedule" : "Go to My Schedule"}
          icon={<Layers3 className="h-5 w-5" />}
          tone="blue"
          footer={
            <>
              <StatPill
                label="Shifts"
                value={`${shiftsInLatestPublished.length}`}
              />
              <StatPill
                label="Expected hours"
                value={formatHours(latestPublishedHours)}
              />
            </>
          }
        />

        <ActionCard
          eyebrow={nextShift ? "Next shift" : "Up next"}
          title={nextShift ? nextShift.label : "No assigned shift yet"}
          body={
            nextShift
              ? `${formatDate(nextShift.date)} • ${formatTimeRange(nextShift.start_time, nextShift.end_time)}`
              : "As soon as you are assigned, your next shift will show here."
          }
          href={scheduleHref}
          buttonLabel={nextShift ? "View Shift Details" : "Open My Schedule"}
          icon={<CalendarClock className="h-5 w-5" />}
          tone="slate"
          footer={
            <>
              <StatPill
                label="Date"
                value={nextShift ? formatDate(nextShift.date) : "—"}
              />
              <StatPill
                label="Period"
                value={nextShift ? nextShift.period_name : latestPublished?.name || "—"}
              />
            </>
          }
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewCard
          label="Published schedules"
          value={`${publishedPeriods.length}`}
          helper={latestPublished ? `Latest: ${latestPublished.name}` : "Nothing posted yet."}
        />
        <OverviewCard
          label="Total assigned shifts"
          value={`${myShifts.length}`}
          helper={nextShift ? `Next up: ${nextShift.label}` : "No assigned shifts yet."}
        />
        <OverviewCard
          label="Expected hours"
          value={formatHours(latestPublishedHours)}
          helper={latestPublished ? "For the latest published schedule." : "Updates when a schedule is posted."}
        />
      </div>

      <SectionCard
        title="Quick actions"
        description="Fast, mobile-friendly shortcuts for the things employees use most."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Link
            href={availabilityHref}
            className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
          >
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <div className="mt-3 text-base font-semibold text-slate-900">Submit availability</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jump straight into the active form.
            </p>
          </Link>

          <Link
            href={scheduleHref}
            className="rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300"
          >
            <CalendarClock className="h-5 w-5 text-blue-600" />
            <div className="mt-3 text-base font-semibold text-slate-900">Open my schedule</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Go directly to the posted schedule and teammates.
            </p>
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <Sparkles className="h-5 w-5 text-slate-700" />
            <div className="mt-3 text-base font-semibold text-slate-900">At a glance</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {nextShift
                ? `Next shift: ${nextShift.label} on ${formatDate(nextShift.date)}.`
                : "No shift is assigned yet for the latest published period."}
            </p>
          </div>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <SectionCard title="Upcoming shifts" description="Your next assigned shifts in published schedules.">
          {myShifts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              You do not have any assigned shifts in a published schedule yet.
            </div>
          ) : (
            <div className="space-y-3">
              {myShifts.slice(0, 5).map((shift) => (
                <div
                  key={shift.shift_id}
                  className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-base font-semibold text-slate-900">{shift.label}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {formatDate(shift.date)} · {formatTimeRange(shift.start_time, shift.end_time)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{shift.period_name}</div>
                  </div>
                  <Button asChild variant="outline" className="rounded-2xl">
                    <Link href={`/my-schedule/${shift.period_id}`}>Open Schedule</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Availability windows" description="Open scheduling periods that still need your response.">
          {collectingPeriods.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              You are caught up on availability right now.
            </div>
          ) : (
            <div className="space-y-3">
              {collectingPeriods.map((period) => (
                <Link
                  key={period.id}
                  href={`/availability/${period.id}`}
                  className="block rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-base font-semibold text-slate-900">{period.name}</div>
                      <div className="mt-1 text-sm text-slate-600">
                        {formatDate(period.start_date)} – {formatDate(period.end_date)}
                      </div>
                    </div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      Open
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {nextShift ? (
        <SectionCard title="Next shift details" description="A clean glance at when you work next.">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Clock3 className="h-4 w-4" /> Date
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">{formatDate(nextShift.date)}</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <CalendarClock className="h-4 w-4" /> Time
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">
                {formatTimeRange(nextShift.start_time, nextShift.end_time)}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <Layers3 className="h-4 w-4" /> Schedule
              </div>
              <div className="mt-2 text-base font-semibold text-slate-900">{nextShift.period_name}</div>
            </div>
          </div>
        </SectionCard>
      ) : null}
    </PageShell>
  )
}

export default EmployeeDashboard
