"use client"

import Link from "next/link"
import { CalendarDays, LayoutDashboard, Settings, Users2 } from "lucide-react"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function AppFooter() {
  const { organization, isManager } = useOrgSafe()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-10 border-t border-slate-200 bg-white">
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">{organization?.name || "TeamMate"}</p>
            <p className="mt-1 text-sm text-slate-500">Scheduling and team coordination, kept simple.</p>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
            >
              <CalendarDays className="h-4 w-4" />
              Schedule
            </Link>
            {isManager ? (
              <Link
                href="/employees"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
              >
                <Users2 className="h-4 w-4" />
                Employees
              </Link>
            ) : null}
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700 transition hover:bg-slate-100"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </nav>
        </div>

        <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} {organization?.name || "TeamMate"}. All rights reserved.</p>
          <p>Built for modern scheduling teams.</p>
        </div>
      </div>
    </footer>
  )
}
