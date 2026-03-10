"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function TopBar({ userEmail }: { userEmail?: string }) {
  const supabase = createClient()
  const { organization } = useOrgSafe()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">
            {organization?.name || "TeamMate"}
          </div>
          <div className="truncate text-xs text-slate-500">
            {userEmail || "Scheduling made simple"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Profile
          </Link>
          <button
            onClick={() => void signOut()}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            type="button"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
