"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedules" },
  { href: "/employees", label: "Employees" },
  { href: "/history", label: "History" },
  { href: "/drop-requests", label: "Drop Requests" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
]

const employeeItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/availability", label: "Available Shifts" },
  { href: "/my-schedule", label: "My Schedule" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profile" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isManager, organization } = useOrgSafe()

  const items = isManager ? managerItems : employeeItems
  const brandColor = organization?.primary_color || "#2563EB"
  const secondary = organization?.secondary_color || "#1E40AF"

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200/80 bg-white md:block">
      <div className="sticky top-0 flex h-screen flex-col p-4">
        <div className="mb-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm">
          <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${brandColor}, ${secondary})` }} />
          <div className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Active Org</div>
            <div className="mt-2 text-base font-semibold text-slate-900">
              {organization?.name || "Organization"}
            </div>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map((item) => {
            const active =
              pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "block rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-sm"
                    : "block rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                }
                style={active ? { background: `linear-gradient(135deg, ${brandColor}, ${secondary})` } : undefined}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
