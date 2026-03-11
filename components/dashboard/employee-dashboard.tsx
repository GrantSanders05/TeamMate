"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  CalendarClock,
  ChevronRight,
  ClipboardCheck,
  Clock3,
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

function MobilePrimaryCard({
  eyebrow,
  title,
  body,
  href,
  buttonLabel,
  tone = "blue",
}: {
  eyebrow: string
  title: string
  body: string
  href: string
  buttonLabel: string
  tone?: "blue" | "emerald"
}) {
  const toneClasses =
    tone === "emerald"
      ? "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-emerald-100/60"
      : "border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-100/70"

  return (
    <div className={`rounded-3xl border p-4 shadow-sm ${toneClasses}`}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
        {eyebrow}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      <Button asChild size="lg" className="mt-4 w-full rounded-2xl">
        <Link href={href}>
          {buttonLabel}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
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
  const availabilityHref = collectingPeriods[0]
    ? `/availability/${collectingPeriods[0].id}`
    : "/availability"
  const scheduleHref = nextShift
    ? `/my-schedule/${nextShift.period_id}`
    : latestPublished
      ? `/my-schedule/${latestPublished.id}`
      : "/my-schedule"

  if (!organization) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">No organization selected.</div>
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6">Loading dashboard...</div>
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="See what needs your attention first."
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button asChild variant="outline" className="rounded-2xl">
            <Link href="/my-schedule">My Schedule</Link>
          </Button>
          <Button asChild className="rounded-2xl">
            <Link href={availabilityHref}>Submit Availability</Link>
          </Button>
        </div>
      }
      className="space-y-5"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <MobilePrimaryCard
          eyebrow={collectingPeriods.length > 0 ? "Availability needed" : "Availability"}
          title={
            collectingPeriods.length > 0
              ? `${collectingPeriods.length} period${collectingPeriods.length === 1 ? "" : "s"} need your response`
              : "You are caught up"
          }
          body={
            collectingPeriods.length > 0
              ? `Open the form now so your manager can schedule you correctly. ${collectingPeriods[0].name} is ready for updates.`
              : "There are no open availability periods right now, but you can still review the availability page."
          }
          href={availabilityHref}
          buttonLabel={collectingPeriods.length > 0 ? "Open Availability Form" : "Open Availability"}
          tone="emerald"
        />

        <MobilePrimaryCard
          eyebrow={latestPublished ? "Schedule posted" : "My schedule"}
          title={latestPublished ? latestPublished.name : "No published schedule yet"}
          body={
            latestPublished
              ? nextShift
                ? `Your next assigned shift is ${formatDate(nextShift.date)} from ${formatTimeRange(nextShift.start_time, nextShift.end_time)}.`
                : "A schedule has been posted. Open it now to check your assigned shifts and teammates."
              : "As soon as your manager publishes a schedule, it will show up here for one-tap access."
          }
          href={scheduleHref}
          buttonLabel={latestPublished ? "Open Schedule" : "Go to My Schedule"}
          tone="blue"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewCard
          label="Availability needed"
          value={`${collectingPeriods.length}`}
          helper={
            collectingPeriods.length > 0
              ? "Open periods still need your response."
              : "No open periods right now."
          }
        />
        <OverviewCard
          label="Published schedules"
          value={`${publishedPeriods.length}`}
          helper={latestPublished ? `Latest: ${latestPublished.name}` : "Nothing published yet."}
        />
        <OverviewCard
          label="Assigned shifts"
          value={`${myShifts.length}`}
          helper={nextShift ? `Next: ${nextShift.label}` : "No assigned shifts yet."}
        />
      </div>

      <SectionCard
        title="Quick actions"
        description="Fast links for the two things employees need most on mobile."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href={availabilityHref}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            <div className="mt-3 text-base font-semibold text-slate-900">Submit availability</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Go straight to the active form without hunting through the app.
            </p>
          </Link>

          <Link
            href={scheduleHref}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <CalendarClock className="h-5 w-5 text-blue-600" />
            <div className="mt-3 text-base font-semibold text-slate-900">Open schedule</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Jump directly into the latest posted schedule or your next assigned period.
            </p>
          </Link>

          <Link
            href="/profile"
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
          >
            <UserCircle2 className="h-5 w-5 text-slate-700" />
            <div className="mt-3 text-base font-semibold text-slate-900">Profile</div>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Keep your account details updated.
            </p>
          </Link>
        </div>
      </SectionCard>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
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
        <SectionCard title="Next shift" description="A quick glance at what is coming up next.">
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
                <ClipboardCheck className="h-4 w-4" /> Period
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
