"use client"

import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function TopBar() {
  const supabase = createClient()
  const { organization } = useOrgSafe()

  async function signOut() {
    await supabase.auth.signOut()
    window.location.href = "/login"
  }

  const logoUrl = organization?.logo_url || null
  const brandColor = organization?.primary_color || "#2563EB"
  const secondary = organization?.secondary_color || "#1E40AF"

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={organization?.name || "Organization logo"}
              className="h-10 w-10 rounded-xl border border-slate-200 object-cover"
            />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold text-white"
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
            >
              {(organization?.name || "O").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {organization?.name || "TeamMate"}
            </p>
            <p className="truncate text-xs text-slate-500">
              Scheduling made simple
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/profile" className="topbar-button">
            Profile
          </Link>
          <button
            onClick={() => void signOut()}
            className="rounded-xl px-3 py-2 text-sm font-medium text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
            type="button"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
