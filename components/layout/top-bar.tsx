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

  return (
    <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur">
      <div className="flex min-h-[64px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50"
            style={{ borderColor: brandColor }}
          >
            {logoUrl ? (
              <img src={logoUrl} alt={`${organization?.name || "Organization"} logo`} className="h-full w-full object-cover" />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-sm font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {(organization?.name || "O").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900 md:text-base">
              {organization?.name || "TeamMate"}
            </div>
            <div className="hidden text-xs text-slate-500 md:block">
              Scheduling made simple
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/profile"
            className="rounded-lg border px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Profile
          </Link>
          <button
            onClick={() => void signOut()}
            className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
            type="button"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}
