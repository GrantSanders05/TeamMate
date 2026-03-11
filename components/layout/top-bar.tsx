"use client"

import Link from "next/link"
import { Bell, LogOut, Search, Sparkles, UserCircle2 } from "lucide-react"

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
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur">
      <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {logoUrl ? (
              <img
                alt={`${organization?.name || "Organization"} logo`}
                className="h-11 w-11 rounded-2xl border border-slate-200 bg-white object-cover shadow-sm"
                src={logoUrl}
              />
            ) : (
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
              >
                {(organization?.name || "O").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                {member?.role === "manager" ? "Manager Workspace" : "Team Workspace"}
              </p>
              <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                {organization?.name || "TeamMate"}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button className="topbar-button" type="button">
              <Search className="h-4 w-4" />
              Search
            </button>

            <button className="topbar-button" type="button">
              <Bell className="h-4 w-4" />
              Alerts
            </button>

            <Link className="topbar-button" href="/profile">
              <UserCircle2 className="h-4 w-4" />
              Profile
            </Link>

            <button
              className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:-translate-y-0.5"
              onClick={() => void signOut()}
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="brand-panel flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="pill-badge mb-3">
              <Sparkles className="h-3.5 w-3.5" />
              Brand Foundation
            </div>

            <h1 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
              Scheduling made simple, cleaner, and more on-brand.
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              A more polished shell gives managers and employees a better first impression across the whole app.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-2xl border border-white/80 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Brand</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Applied</p>
            </div>
            <div className="rounded-2xl border border-white/80 bg-white/80 p-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Shell</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">Upgraded</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
