"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
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
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/schedule", label: "Schedules", icon: CalendarDays },
  { href: "/drop-requests", label: "Drops", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: Settings },
]

const employeeItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/availability", label: "Avail.", icon: CalendarDays },
  { href: "/my-schedule", label: "Schedule", icon: ClipboardList },
  { href: "/profile", label: "Profile", icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isManager } = useOrgSafe()
  const navItems = isManager ? managerItems : employeeItems

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
      <div className="grid grid-cols-4 gap-1 px-2 py-2">
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
                "flex min-h-[52px] flex-col items-center justify-center rounded-lg text-[11px] font-medium",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
