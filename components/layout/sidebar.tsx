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

  return (
    <div className="flex h-full flex-col p-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          Active Org
        </div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {organization?.name || "Organization"}
        </div>
      </div>

      <nav className="mt-6 space-y-1">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "block rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
