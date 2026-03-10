"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule", label: "Schedules" },
  { href: "/employees", label: "Employees" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
]

const employeeItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/availability", label: "Available Shifts" },
  { href: "/my-schedule", label: "My Schedule" },
  { href: "/profile", label: "Profile" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isManager, organization } = useOrgSafe()
  const items = isManager ? managerItems : employeeItems
  const brandColor = organization?.primary_color || "#2563EB"

  return (
    <aside className="hidden w-72 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
          Active Org
        </p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">
          {organization?.name || "Organization"}
        </h2>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
              style={active ? { boxShadow: `inset 3px 0 0 ${brandColor}` } : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
