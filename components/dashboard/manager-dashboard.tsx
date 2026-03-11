"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Archive, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Settings, Users2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type Period = { id: string; name: string; start_date: string; end_date: string; status: string }

function formatDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
}

function statusMeta(status: string) {
  switch (status) {
    case "collecting":
      return { label: "Collecting Availability", pill: "border-amber-200 bg-amber-50 text-amber-800" }
    case "scheduling":
      return { label: "Scheduling In Progress", pill: "border-blue-200 bg-blue-50 text-blue-800" }
    case "published":
      return { label: "Published", pill: "border-emerald-200 bg-emerald-50 text-emerald-800" }
    case "archived":
      return { label: "Archived", pill: "border-slate-200 bg-slate-50 text-slate-700" }
    default:
      return { label: "Draft", pill: "border-violet-200 bg-violet-50 text-violet-800" }
  }
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
      if (!organization) return setLoading(false)
      const [{ data: periodData }, { data: dropData }, { data: memberData }] = await Promise.all([
        supabase.from("scheduling_periods").select("id, name, start_date, end_date, status").eq("organization_id", organization.id).order("start_date", { ascending: false }),
        supabase.from("drop_requests").select("id").eq("status", "pending"),
        supabase.from("organization_members").select("id").eq("organization_id", organization.id).eq("role", "employee").eq("is_active", true),
      ])
      if (!mounted) return
      setPeriods((periodData as Period[]) || [])
      setPendingDrops((dropData || []).length)
      setEmployeeCount((memberData || []).length)
      setLoading(false)
    }
    void loadDashboard()
    return () => { mounted = false }
  }, [organization?.id, supabase])

  const activePeriods = useMemo(() => periods.filter((p) => ["draft", "collecting", "scheduling", "published"].includes(p.status)), [periods])
  const archivedPeriods = useMemo(() => periods.filter((p) => p.status === "archived"), [periods])
  const publishedPeriods = useMemo(() => periods.filter((p) => p.status === "published"), [periods])
  const collectingPeriods = useMemo(() => periods.filter((p) => p.status === "collecting"), [periods])
  const latestPeriod = activePeriods[0] || periods[0] || null
  const latestMeta = statusMeta(latestPeriod?.status || "draft")

  if (!organization) return <PageShell title="Dashboard" subtitle="Manage your organization from one place."><SectionCard><p className="text-sm text-slate-600">No organization selected.</p></SectionCard></PageShell>
  if (loading) return <PageShell title="Dashboard" subtitle="Manage your organization from one place."><SectionCard><p className="text-sm text-slate-600">Loading dashboard...</p></SectionCard></PageShell>

  return (
    <PageShell title="Dashboard" subtitle="A polished command center for periods, people, and schedule follow-up.">
      <div className="space-y-6">
        <OrgBrandHeader />
        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <div className="brand-hero rounded-[32px] border border-slate-900/10 p-6 text-white shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Manager Snapshot</p>
                <h2 className="mt-4 text-3xl font-semibold leading-tight">{latestPeriod ? latestPeriod.name : "No schedule periods yet"}</h2>
                <p className="mt-3 text-base text-white/85">{latestPeriod ? `${formatDate(latestPeriod.start_date)} – ${formatDate(latestPeriod.end_date)}` : "Create your first schedule period to begin."}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-white/10 p-3"><CalendarClock className="h-7 w-7 text-white" /></div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${latestMeta.pill}`}>{latestMeta.label}</div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">{activePeriods.length} active period{activePeriods.length === 1 ? "" : "s"}</div>
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">{employeeCount} employee{employeeCount === 1 ? "" : "s"}</div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <Button asChild className="h-12 rounded-2xl bg-white text-slate-950 hover:bg-slate-100"><Link href="/schedule">Open Schedules</Link></Button>
              <Button asChild variant="outline" className="h-12 rounded-2xl border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white"><Link href="/employees">Manage Employees</Link></Button>
            </div>
          </div>

          <SectionCard>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">Quick Actions</p>
            <div className="mt-5 space-y-3">
              <Link href="/schedule" className="brand-link-tile"><div className="flex items-start gap-3"><div className="rounded-full border border-slate-200 bg-white p-2.5"><ClipboardList className="h-5 w-5 text-slate-700" /></div><div><p className="text-lg font-semibold text-slate-900">Schedules</p><p className="text-sm text-slate-600">Build periods, shifts, and assignments</p></div></div><ArrowRight className="h-5 w-5 text-slate-400" /></Link>
              <Link href="/history" className="brand-link-tile"><div className="flex items-start gap-3"><div className="rounded-full border border-slate-200 bg-white p-2.5"><Archive className="h-5 w-5 text-slate-700" /></div><div><p className="text-lg font-semibold text-slate-900">History</p><p className="text-sm text-slate-600">Review archived schedule periods</p></div></div><ArrowRight className="h-5 w-5 text-slate-400" /></Link>
              <Link href="/settings" className="brand-link-tile"><div className="flex items-start gap-3"><div className="rounded-full border border-slate-200 bg-white p-2.5"><Settings className="h-5 w-5 text-slate-700" /></div><div><p className="text-lg font-semibold text-slate-900">Settings</p><p className="text-sm text-slate-600">Adjust branding, templates, and org tools</p></div></div><ArrowRight className="h-5 w-5 text-slate-400" /></Link>
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <SectionCard><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Active Periods</p><p className="mt-3 text-4xl font-semibold text-slate-900">{activePeriods.length}</p><p className="mt-2 text-sm text-slate-600">Current periods across draft, collecting, scheduling, and published.</p></div><div className="rounded-2xl bg-blue-50 p-3 text-blue-700"><CalendarClock className="h-6 w-6" /></div></div></SectionCard>
          <SectionCard><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Pending Drops</p><p className="mt-3 text-4xl font-semibold text-slate-900">{pendingDrops}</p><p className="mt-2 text-sm text-slate-600">Employee drop requests waiting on manager review.</p></div><div className="rounded-2xl bg-amber-50 p-3 text-amber-700"><AlertCircle className="h-6 w-6" /></div></div></SectionCard>
          <SectionCard><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Team Size</p><p className="mt-3 text-4xl font-semibold text-slate-900">{employeeCount}</p><p className="mt-2 text-sm text-slate-600">Active employees currently attached to this organization.</p></div><div className="rounded-2xl bg-emerald-50 p-3 text-emerald-700"><Users2 className="h-6 w-6" /></div></div></SectionCard>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Recent schedule periods" description="Keep tabs on your most recent periods without jumping into the full schedules page.">
            {periods.length === 0 ? <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No schedule periods yet.</div> : <div className="space-y-3">{periods.slice(0, 5).map((period) => { const meta = statusMeta(period.status); return <div key={period.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${meta.pill}`}>{meta.label}</div><h3 className="mt-3 text-xl font-semibold text-slate-900">{period.name}</h3><p className="mt-1 text-sm text-slate-600">{formatDate(period.start_date)} – {formatDate(period.end_date)}</p></div><Button asChild variant="outline"><Link href="/schedule">Open</Link></Button></div></div> })}</div>}
          </SectionCard>
          <SectionCard title="Manager attention board" description="A fast visual summary of what likely needs action first.">
            <div className="space-y-3">
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4"><div className="flex items-start gap-3"><div className="rounded-full bg-white p-2 text-amber-700"><AlertCircle className="h-5 w-5" /></div><div><p className="text-base font-semibold text-amber-950">Pending drop requests</p><p className="mt-1 text-sm text-amber-900">{pendingDrops === 0 ? "No employee drop requests are waiting right now." : `${pendingDrops} request${pendingDrops === 1 ? "" : "s"} need manager review.`}</p></div></div></div>
              <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4"><div className="flex items-start gap-3"><div className="rounded-full bg-white p-2 text-blue-700"><ClipboardList className="h-5 w-5" /></div><div><p className="text-base font-semibold text-blue-950">Availability collection</p><p className="mt-1 text-sm text-blue-900">{collectingPeriods.length === 0 ? "No periods are currently collecting availability." : `${collectingPeriods.length} period${collectingPeriods.length === 1 ? "" : "s"} are still collecting availability.`}</p></div></div></div>
              <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4"><div className="flex items-start gap-3"><div className="rounded-full bg-white p-2 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></div><div><p className="text-base font-semibold text-emerald-950">Published schedules</p><p className="mt-1 text-sm text-emerald-900">{publishedPeriods.length === 0 ? "No schedule periods are currently published." : `${publishedPeriods.length} published period${publishedPeriods.length === 1 ? "" : "s"} are live for employees.`}</p></div></div></div>
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"><div className="flex items-start gap-3"><div className="rounded-full bg-white p-2 text-slate-700"><Archive className="h-5 w-5" /></div><div><p className="text-base font-semibold text-slate-900">Archive count</p><p className="mt-1 text-sm text-slate-600">{archivedPeriods.length} archived period{archivedPeriods.length === 1 ? "" : "s"} saved in history.</p></div></div></div>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}

export default ManagerDashboard
