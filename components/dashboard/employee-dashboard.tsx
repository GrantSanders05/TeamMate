"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarClock, ClipboardCheck, Clock3, FolderOpenDot } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

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

function formatShortDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
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

function StatTile({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{helper}</p>
    </div>
  )
}

function QuickActionCard({
  label,
  title,
  body,
  href,
  cta,
  icon,
  tone = "blue",
}: {
  label: string
  title: string
  body: string
  href: string
  cta: string
  icon: React.ReactNode
  tone?: "blue" | "emerald"
}) {
  const styles =
    tone === "emerald"
      ? "border-emerald-200/80 from-emerald-50 via-white to-emerald-100/70"
      : "border-blue-200/80 from-blue-50 via-white to-indigo-100/70"

  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 shadow-sm ${styles}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-950">{title}</h3>
        </div>
        <div className="rounded-2xl border border-white/70 bg-white/80 p-2.5 text-slate-700 shadow-sm">{icon}</div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>

      <Button asChild className="mt-4 h-11 rounded-xl px-4">
        <Link href={href}>
          {cta}
          <ArrowRight className="ml-2 h-4 w-4" />
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

  const latestPublished = useMemo(() => publishedPeriods[0] || null, [publishedPeriods])
  const nextShift = useMemo(() => myShifts[0] || null, [myShifts])

  const availabilityHref = collectingPeriods[0] ? `/availability/${collectingPeriods[0].id}` : "/availability"
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
    return null
  }

  return (
    <PageShell
      title="Employee Dashboard"
      description="Quick access to availability, your posted schedule, and the next shift you need to know about."
    >
      <SectionCard>
        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            Loading your dashboard…
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Overview</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Everything you need, right here.</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Check whether availability is needed, jump into the published schedule, and see your next shift at a glance.
                  </p>
                </div>

                {nextShift ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-700">Next shift</p>
                    <p className="mt-1 text-base font-semibold text-slate-950">{nextShift.label}</p>
                    <p className="mt-1 text-sm text-slate-600">{formatShortDate(nextShift.date)} · {formatTimeRange(nextShift.start_time, nextShift.end_time)}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <StatTile
                  label="Availability"
                  value={collectingPeriods.length > 0 ? "Needed" : "Done"}
                  helper={collectingPeriods.length > 0 ? `${collectingPeriods.length} open period${collectingPeriods.length === 1 ? "" : "s"}` : "No open forms right now"}
                />
                <StatTile
                  label="Published shifts"
                  value={`${shiftsInLatestPublished.length}`}
                  helper={latestPublished ? `In ${latestPublished.name}` : "No published schedule yet"}
                />
                <StatTile
                  label="Expected hours"
                  value={formatHours(latestPublishedHours)}
                  helper={latestPublished ? "From the current published schedule" : "Hours will appear when posted"}
                />
                <StatTile
                  label="Next date"
                  value={nextShift ? formatShortDate(nextShift.date) : "—"}
                  helper={nextShift ? nextShift.label : "No assigned shift yet"}
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <QuickActionCard
                label="Availability needed"
                title={collectingPeriods.length > 0 ? "Submit your availability" : "You are caught up"}
                body={
                  collectingPeriods.length > 0
                    ? `There ${collectingPeriods.length === 1 ? "is" : "are"} ${collectingPeriods.length} open availability period${collectingPeriods.length === 1 ? "" : "s"}. Go straight to the form and update your days quickly.`
                    : "There are no open availability forms right now, so you do not need to submit anything at the moment."
                }
                href={availabilityHref}
                cta={collectingPeriods.length > 0 ? "Open availability form" : "View availability"}
                icon={<ClipboardCheck className="h-5 w-5" />}
              />

              <QuickActionCard
                label="My schedule"
                title={latestPublished ? "Open your posted schedule" : "Schedule not posted yet"}
                body={
                  latestPublished
                    ? `See your assigned shifts, teammates, and the full published schedule for ${latestPublished.name}.`
                    : "Once a schedule is published, you will be able to jump straight into it here."
                }
                href={scheduleHref}
                cta={latestPublished ? "Open my schedule" : "View schedule page"}
                icon={<CalendarClock className="h-5 w-5" />}
                tone="emerald"
              />
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.35fr_0.95fr]">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Upcoming shifts</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">What’s coming up next</h3>
                  </div>
                  <Clock3 className="h-5 w-5 text-slate-400" />
                </div>

                {myShifts.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    You do not have any assigned shifts in a published schedule yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {myShifts.slice(0, 4).map((shift) => (
                      <Link
                        key={shift.shift_id}
                        href={`/my-schedule/${shift.period_id}`}
                        className="block rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-slate-300 hover:bg-white"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-base font-semibold text-slate-950">{shift.label}</p>
                            <p className="mt-1 text-sm text-slate-600">{formatShortDate(shift.date)} · {formatTimeRange(shift.start_time, shift.end_time)}</p>
                            <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{shift.period_name}</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-slate-700">
                            Open
                            <ArrowRight className="h-4 w-4" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Open periods</p>
                    <h3 className="mt-2 text-lg font-semibold text-slate-950">Availability links</h3>
                  </div>
                  <FolderOpenDot className="h-5 w-5 text-slate-400" />
                </div>

                {collectingPeriods.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    You are caught up on availability right now.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {collectingPeriods.map((period) => (
                      <div key={period.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                        <p className="text-base font-semibold text-slate-950">{period.name}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {formatDate(period.start_date)} – {formatDate(period.end_date)}
                        </p>
                        <Button asChild variant="outline" className="mt-4 h-10 rounded-xl">
                          <Link href={`/availability/${period.id}`}>Open period</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </SectionCard>
    </PageShell>
  )
}
