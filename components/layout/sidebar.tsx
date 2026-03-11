"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Building2,
  CalendarDays,
  Clock3,
  History,
  Palette,
  Settings,
  ShieldCheck,
  Users2,
  UserRound,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/schedule", label: "Schedules", icon: CalendarDays },
  { href: "/employees", label: "Employees", icon: Users2 },
  { href: "/history", label: "History", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/profile", label: "Profile", icon: UserRound },
]

const employeeItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/availability", label: "Available Shifts", icon: Clock3 },
  { href: "/my-schedule", label: "My Schedule", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isManager, organization } = useOrgSafe()
  const items = isManager ? managerItems : employeeItems
  const brandColor = organization?.primary_color || "#2563EB"
  const secondaryColor = organization?.secondary_color || "#1D4ED8"
  const logoUrl = organization?.logo_url || null

  return (
    <div className="flex h-full flex-col p-5">
      <div className="brand-panel subtle-grid p-5">
        <div className="mb-6 flex items-center gap-3">
          {logoUrl ? (
            <img
              alt={`${organization?.name || "Organization"} logo`}
              className="h-12 w-12 rounded-2xl border border-white/70 bg-white object-cover shadow-sm"
              src={logoUrl}
            />
          ) : (
            <div
              className="flex h-12 w-12 items-center justify-center rounded-2xl text-base font-semibold text-white shadow-sm"
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})` }}
            >
              {(organization?.name || "O").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Active Org
            </p>
            <h2 className="truncate text-xl font-semibold tracking-tight text-slate-950">
              {organization?.name || "Organization"}
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
              Role
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {isManager ? "Manager" : "Employee"}
            </p>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/75 p-3">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <Palette className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-[0.15em] text-slate-500">
              Theme
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              Brand Ready
            </p>
          </div>
        </div>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-2">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              className={cn("nav-pill", active && "nav-pill-active")}
              href={item.href}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl border border-transparent transition-all",
                  active ? "bg-slate-950 text-white shadow-sm" : "bg-slate-100 text-slate-600"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>

              <span className="flex-1 truncate">{item.label}</span>

              {active ? (
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})` }}
                />
              ) : null}
            </Link>
          )
        })}
      </nav>

      <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})` }}
          />
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Workspace quality
          </p>
        </div>

        <p className="text-sm leading-6 text-slate-600">
          TeamMate now uses a cleaner brand shell so every page feels more premium and consistent.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
          <Building2 className="h-4 w-4" />
          Brand Foundation Pack
        </div>
      </div>
    </div>
  )
}
