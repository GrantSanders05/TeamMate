"use client"

import Link from "next/link"
import { LogOut, UserCircle2 } from "lucide-react"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { createClient } from "@/lib/supabase/client"

export function TopBar() {
  const supabase = createClient()
  const { organization, member } = useOrgSafe()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const logoUrl = organization?.logo_url || null
  const brandColor = organization?.primary_color || "#2563EB"
  const secondary = organization?.secondary_color || "#1D4ED8"

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={organization?.name || "Organization logo"}
                className="h-10 w-10 rounded-2xl border border-slate-200 object-cover shadow-sm"
              />
            ) : (
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
              >
                {(organization?.name || "O").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                {member?.role === "manager" ? "Manager Dashboard" : "Employee Dashboard"}
              </p>
              <p className="truncate text-base font-semibold text-slate-900">
                {organization?.name || "TeamMate"}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/profile"
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <UserCircle2 className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </Link>

          <button
            onClick={() => void signOut()}
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
            className="inline-flex h-10 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            type="button"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
