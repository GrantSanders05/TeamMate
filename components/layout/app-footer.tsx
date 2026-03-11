"use client"

import Link from "next/link"
import { CalendarDays, LayoutDashboard, Settings, Users2 } from "lucide-react"

import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function AppFooter() {
  const { organization, isManager } = useOrgSafe()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200/80 bg-white/80 px-4 pb-24 pt-6 backdrop-blur sm:px-6 lg:px-8 lg:pb-6">
      <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {organization?.name || "TeamMate"}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Clean scheduling, clearer communication, and a more polished workspace for managers and employees.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link className="topbar-button" href="/dashboard">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link className="topbar-button" href={isManager ? "/schedule" : "/my-schedule"}>
              <CalendarDays className="h-4 w-4" />
              Schedule
            </Link>
            {isManager ? (
              <Link className="topbar-button" href="/employees">
                <Users2 className="h-4 w-4" />
                Employees
              </Link>
            ) : null}
            <Link className="topbar-button" href="/settings">
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-500">
          © {year} {organization?.name || "TeamMate"}. Built for teams that want a cleaner, more professional scheduling experience.
        </div>
      </div>
    </footer>
  )
}
