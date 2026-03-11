"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CalendarDays, CircleDot, FolderClock, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { createClient } from "@/lib/supabase/client"
import { formatDate } from "@/lib/utils"

type Period = {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

const statusTone: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700",
  collecting: "bg-amber-100 text-amber-800",
  scheduling: "bg-sky-100 text-sky-800",
  published: "bg-emerald-100 text-emerald-800",
}

export function ManagerDashboard() {
  const supabase = createClient()
  const { organization } = useOrgSafe()
  const [periods, setPeriods] = useState<Period[]>([])
  const [pendingDrops, setPendingDrops] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadDashboard() {
      if (!organization) {
        setLoading(false)
        return
      }

      const { data: periodData } = await supabase
        .from("scheduling_periods")
        .select("id, name, start_date, end_date, status")
        .eq("organization_id", organization.id)
        .order("start_date", { ascending: false })

      const { data: dropData } = await supabase
        .from("drop_requests")
        .select("id, status")
        .eq("status", "pending")

      setPeriods((periodData as Period[]) || [])
      setPendingDrops((dropData || []).length)
      setLoading(false)
    }

    void loadDashboard()
  }, [organization?.id, supabase])

  const activePeriods = useMemo(
    () => periods.filter((period) => ["draft", "collecting", "scheduling", "published"].includes(period.status)),
    [periods]
  )

  if (!organization) {
    return (
      <PageShell title="Dashboard" subtitle="No organization selected yet.">
        <SectionCard title="Organization Required" description="Choose or create an organization to start using TeamMate.">
          <p className="text-sm text-slate-600">Once an organization is active, your manager tools and branding will appear here.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell title="Manager Dashboard" subtitle="Loading your latest scheduling data...">
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
      title="Manager Dashboard"
      subtitle="Stay on top of active periods, drop requests, and the next actions your team needs from you."
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/settings">
              <Settings2 className="h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button asChild>
            <Link href="/schedule">
              Open Schedules
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </>
      }
    >
      <OrgBrandHeader
        compact
        subtitle="Your workspace now carries a cleaner, more branded manager view."
        title={organization.name}
      />

      <StatsCards
        items={[
          {
            label: "Active Periods",
            value: activePeriods.length,
            helper: "Draft, collecting, scheduling, and published periods that still need attention.",
          },
          {
            label: "Pending Drop Requests",
            value: pendingDrops,
            helper: "Shift drop requests waiting for manager review.",
          },
          {
            label: "All Schedule Periods",
            value: periods.length,
            helper: "Every scheduling period currently tracked for this organization.",
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <SectionCard
          description="Your most recent schedule periods, with a cleaner hierarchy and more scannable status styling."
          title="Recent Schedule Periods"
        >
          {periods.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No schedule periods yet. Create your first one to begin collecting availability and building a schedule.
            </div>
          ) : (
            <div className="space-y-3">
              {periods.slice(0, 5).map((period) => (
                <div
                  key={period.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                        Period
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${statusTone[period.status] || "bg-slate-100 text-slate-700"}`}>
                        {period.status}
                      </span>
                    </div>
                    <h3 className="truncate text-lg font-semibold text-slate-950">{period.name}</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(period.start_date)} – {formatDate(period.end_date)}
                    </p>
                  </div>

                  <Button asChild variant="outline">
                    <Link href="/schedule">
                      Open
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            description="Quick links for the actions managers use the most."
            title="Quick Actions"
          >
            <div className="grid gap-3">
              <Link
                className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                href="/schedule"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">Open Schedules</p>
                    <p className="text-sm text-slate-600">Manage availability, staffing, and published periods.</p>
                  </div>
                </div>
              </Link>

              <Link
                className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                href="/history"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <FolderClock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">Review History</p>
                    <p className="text-sm text-slate-600">Look back at archived schedules and completed periods.</p>
                  </div>
                </div>
              </Link>

              <Link
                className="group rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                href="/settings"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Settings2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">Update Branding</p>
                    <p className="text-sm text-slate-600">Tune colors, logo, and workspace identity in settings.</p>
                  </div>
                </div>
              </Link>
            </div>
          </SectionCard>

          <SectionCard
            description="A cleaner summary card for what still needs review."
            title="Manager Snapshot"
          >
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CircleDot className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Active periods</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{activePeriods.length}</span>
              </div>

              <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CircleDot className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Pending drops</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{pendingDrops}</span>
              </div>

              <div className="flex items-center justify-between rounded-[22px] bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <CircleDot className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-700">Periods on record</span>
                </div>
                <span className="text-sm font-semibold text-slate-950">{periods.length}</span>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
