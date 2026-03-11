"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Archive, CalendarClock, ClipboardList, Settings, Users2 } from "lucide-react"
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

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function statusMeta(status: string) {
  switch (status) {
    case "collecting":
      return {
        label: "Collecting",
        pill: "border-amber-200 bg-amber-50 text-amber-800",
      }
    case "scheduling":
      return {
        label: "Scheduling",
        pill: "border-blue-200 bg-blue-50 text-blue-800",
      }
    case "published":
      return {
        label: "Published",
        pill: "border-emerald-200 bg-emerald-50 text-emerald-800",
      }
    case "archived":
      return {
        label: "Archived",
        pill: "border-slate-200 bg-slate-50 text-slate-700",
      }
    default:
      return {
        label: "Draft",
        pill: "border-violet-200 bg-violet-50 text-violet-800",
      }
  }
}

function DashboardStat({
  label,
  value,
  helper,
}: {
  label: string
  value: number | string
  helper: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

export function ManagerDashboard() {
  const supabase = createClient()
  const { organization } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [pendingDrops, setPendingDrops] = useState(0)
  const [employeeCount, setEmployeeCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      if (!organization) {
        setLoading(false)
        return
      }

      const [{ data: periodData }, { data: dropData }, { data: memberData }] =
        await Promise.all([
          supabase
            .from("scheduling_periods")
            .select("id, name, start_date, end_date, status")
            .eq("organization_id", organization.id)
            .order("start_date", { ascending: false }),
          supabase.from("drop_requests").select("id").eq("status", "pending"),
          supabase
            .from("organization_members")
            .select("id")
            .eq("organization_id", organization.id)
            .eq("role", "employee")
            .eq("is_active", true),
        ])

      if (!mounted) return

      setPeriods((periodData as Period[]) || [])
      setPendingDrops((dropData || []).length)
      setEmployeeCount((memberData || []).length)
      setLoading(false)
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [organization?.id, supabase])

  const activePeriods = useMemo(
    () => periods.filter((p) => ["draft", "collecting", "scheduling", "published"].includes(p.status)),
    [periods],
  )
  const archivedPeriods = useMemo(
    () => periods.filter((p) => p.status === "archived"),
    [periods],
  )
  const publishedPeriods = useMemo(
    () => periods.filter((p) => p.status === "published"),
    [periods],
  )
  const collectingPeriods = useMemo(
    () => periods.filter((p) => p.status === "collecting"),
    [periods],
  )
  const latestPeriod = activePeriods[0] || periods[0] || null

  if (!organization) {
    return <div className="text-sm text-slate-500">No organization selected.</div>
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading dashboard...</div>
  }

  return (
    <PageShell
      title="Manager Dashboard"
      subtitle={organization.name}
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link href="/schedule">Open Schedule</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/employees">Manage Employees</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardStat
            label="Active Periods"
            value={activePeriods.length}
            helper="Current schedule periods still in progress."
          />
          <DashboardStat
            label="Pending Drops"
            value={pendingDrops}
            helper="Requests waiting on manager review."
          />
          <DashboardStat
            label="Team Size"
            value={employeeCount}
            helper="Active employees in this organization."
          />
          <DashboardStat
            label="Archived"
            value={archivedPeriods.length}
            helper="Finished periods saved in history."
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Recent Periods" className="shadow-sm">
            {periods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                No schedule periods yet.
              </div>
            ) : (
              <div className="space-y-3">
                {periods.slice(0, 6).map((period) => {
                  const meta = statusMeta(period.status)
                  return (
                    <div
                      key={period.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-slate-900">
                            {period.name}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${meta.pill}`}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(period.start_date)} – {formatDate(period.end_date)}
                        </p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/schedule">Open</Link>
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <div className="space-y-6">
            <SectionCard title="Quick Actions" className="shadow-sm">
              <div className="grid gap-3">
                <Link
                  href="/schedule"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <CalendarClock className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">Schedules</p>
                      <p className="text-sm text-slate-500">Build periods, shifts, and assignments</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/history"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Archive className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">History</p>
                      <p className="text-sm text-slate-500">Review archived schedules</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/settings"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">Settings</p>
                      <p className="text-sm text-slate-500">Manage branding and org tools</p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/employees"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <Users2 className="h-5 w-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-900">Employees</p>
                      <p className="text-sm text-slate-500">View and manage your team</p>
                    </div>
                  </div>
                </Link>
              </div>
            </SectionCard>

            <SectionCard title="At a Glance" className="shadow-sm">
              <div className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-3 rounded-2xl bg-slate-50 p-4">
                  <div>
                    <p className="font-medium text-slate-900">Current Period</p>
                    <p className="mt-1 text-slate-500">
                      {latestPeriod
                        ? `${latestPeriod.name} · ${formatDate(latestPeriod.start_date)} – ${formatDate(latestPeriod.end_date)}`
                        : "Create your first period to get started."}
                    </p>
                  </div>
                  {latestPeriod ? (
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta(latestPeriod.status).pill}`}>
                      {statusMeta(latestPeriod.status).label}
                    </span>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">Availability</p>
                    <p className="mt-1 text-slate-500">
                      {collectingPeriods.length === 0
                        ? "No periods are collecting availability right now."
                        : `${collectingPeriods.length} period${collectingPeriods.length === 1 ? "" : "s"} still collecting availability.`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-medium text-slate-900">Published</p>
                    <p className="mt-1 text-slate-500">
                      {publishedPeriods.length === 0
                        ? "No periods are published right now."
                        : `${publishedPeriods.length} published period${publishedPeriods.length === 1 ? "" : "s"} are live for employees.`}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 text-slate-500" />
                      <p className="font-medium text-slate-900">Drop Requests</p>
                    </div>
                    <p className="mt-1 text-slate-500">
                      {pendingDrops === 0
                        ? "No employee drop requests are waiting right now."
                        : `${pendingDrops} request${pendingDrops === 1 ? "" : "s"} need manager review.`}
                    </p>
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default ManagerDashboard
