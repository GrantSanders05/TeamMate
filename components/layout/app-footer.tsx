"use client"

import Link from "next/link"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function AppFooter() {
  const { organization } = useOrgSafe()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 text-sm text-slate-600 sm:px-6 lg:px-8 xl:pl-80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">
              {organization?.name || "TeamMate"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Clean scheduling, clearer communication, and a more polished team workspace.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
            <Link href="/dashboard" className="transition hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/schedule" className="transition hover:text-slate-900">
              Schedule
            </Link>
            <Link href="/employees" className="transition hover:text-slate-900">
              Employees
            </Link>
            <Link href="/settings" className="transition hover:text-slate-900">
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} {organization?.name || "TeamMate"}. All rights reserved.</span>
          <span>Built for managers and employees who need a cleaner schedule experience.</span>
        </div>
      </div>
    </footer>
  )
}
