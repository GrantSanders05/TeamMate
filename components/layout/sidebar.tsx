"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Archive,
  CalendarDays,
  ClipboardList,
  Home,
  Settings,
  User,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/schedule", label: "Schedules", icon: CalendarDays },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/drop-requests", label: "Drop Requests", icon: ClipboardList },
  { href: "/history", label: "History", icon: Archive },
  { href: "/settings", label: "Settings", icon: Settings },
]

const employeeItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/availability", label: "Available Shifts", icon: CalendarDays },
  { href: "/my-schedule", label: "My Schedule", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const { organization, isManager, isLoading } = useOrgSafe()
  const navItems = isManager ? managerItems : employeeItems

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
      <div className="border-b border-slate-200 px-5 py-5">
        <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
          Organization
        </div>
        <div className="mt-2 text-lg font-semibold text-slate-900">
          {isLoading ? "Loading..." : organization?.name || "Teammate"}
        </div>
        {organization?.join_code ? (
          <div className="mt-1 text-sm text-slate-500">
            Join code: <span className="font-medium text-slate-700">{organization.join_code}</span>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
