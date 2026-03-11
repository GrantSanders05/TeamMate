"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Archive, ArrowRight, CalendarClock, ClipboardList, Settings, Users2 } from "lucide-react"
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
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{helper}</p>
    </div>
  )
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  subtle,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  subtle?: boolean
}) {
  return (
    <Link
      href={href}
      className={`group flex h-full items-start justify-between gap-4 rounded-3xl border p-5 shadow-sm transition ${
        subtle
          ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
          : "border-blue-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 hover:border-blue-300"
      }`}
    >
      <div>
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700" />
    </Link>
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

      const [{ data: periodData }, { data: dropData }, { data: memberData }] = await Promise.all([
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
  const archivedPeriods = useMemo(() => periods.filter((p) => p.status === "archived"), [periods])
  const publishedPeriods = useMemo(() => periods.filter((p) => p.status === "published"), [periods])
  const collectingPeriods = useMemo(() => periods.filter((p) => p.status === "collecting"), [periods])
  const latestPeriod = activePeriods[0] || periods[0] || null

  if (!organization) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">No organization selected.</div>
  }

  if (loading) {
    return <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading dashboard...</div>
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="Manage schedules, employees, and upcoming periods from one place."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="shadow-sm">
            <Link href="/schedule">Open Schedule</Link>
          </Button>
          <Button asChild variant="outline" className="shadow-sm">
            <Link href="/employees">Manage Employees</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Quick Actions</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Run your scheduling workflow.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Start in the places you use most: schedules, employees, history, and organization settings.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <QuickAction
                href="/schedule"
                icon={CalendarClock}
                title="Open Schedule"
                description="Build periods, assign shifts, and publish the week."
              />
              <QuickAction
                href="/employees"
                icon={Users2}
                title="Manage Employees"
                description="Review your team, availability, and active employee roster."
                subtle
              />
              <QuickAction
                href="/history"
                icon={Archive}
                title="History"
                description="Look back at archived schedules and prior periods."
                subtle
              />
              <QuickAction
                href="/settings"
                icon={Settings}
                title="Settings"
                description="Update branding, organization details, and workspace tools."
                subtle
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            <DashboardStat label="Active Periods" value={activePeriods.length} helper="Open or in-progress schedules" />
            <DashboardStat label="Employees" value={employeeCount} helper="Active team members in this organization" />
            <DashboardStat label="Drop Requests" value={pendingDrops} helper="Waiting for manager review" />
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
          <SectionCard title="Recent Periods" description="Your latest schedule periods and their current status.">
            {periods.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No schedule periods yet.
              </div>
            ) : (
              <div className="space-y-3">
                {periods.slice(0, 6).map((period) => {
                  const meta = statusMeta(period.status)

                  return (
                    <div
                      key={period.id}
                      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{period.name}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(period.start_date)} – {formatDate(period.end_date)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${meta.pill}`}>
                          {meta.label}
                        </span>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/schedule">Open</Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Overview" description="Key scheduling signals for the current workspace.">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Current Period</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {latestPeriod
                    ? `${latestPeriod.name} · ${formatDate(latestPeriod.start_date)} – ${formatDate(latestPeriod.end_date)}`
                    : "Create your first period to get started."}
                </p>
                {latestPeriod ? (
                  <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusMeta(latestPeriod.status).pill}`}>
                    {statusMeta(latestPeriod.status).label}
                  </span>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Availability</p>
                <p className="mt-2 text-sm text-slate-600">
                  {collectingPeriods.length === 0
                    ? "No periods are collecting availability right now."
                    : `${collectingPeriods.length} period${collectingPeriods.length === 1 ? "" : "s"} still collecting availability.`}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Published</p>
                <p className="mt-2 text-sm text-slate-600">
                  {publishedPeriods.length === 0
                    ? "No periods are published right now."
                    : `${publishedPeriods.length} published period${publishedPeriods.length === 1 ? "" : "s"} are live for employees.`}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <p className="text-sm font-semibold text-slate-900">Archived</p>
                <p className="mt-2 text-sm text-slate-600">
                  {archivedPeriods.length === 0
                    ? "No archived periods yet."
                    : `${archivedPeriods.length} archived period${archivedPeriods.length === 1 ? "" : "s"} available for review.`}
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}

export default ManagerDashboard
