"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, CalendarDays, Clock3, UserRound, Users2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Home", icon: BarChart3 },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/employees", label: "Team", icon: Users2 },
  { href: "/profile", label: "Profile", icon: UserRound },
]

const employeeItems = [
  { href: "/dashboard", label: "Home", icon: BarChart3 },
  { href: "/availability", label: "Avail.", icon: Clock3 },
  { href: "/my-schedule", label: "Schedule", icon: CalendarDays },
  { href: "/profile", label: "Profile", icon: UserRound },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isManager, organization } = useOrgSafe()
  const items = isManager ? managerItems : employeeItems
  const brandColor = organization?.primary_color || "#2563EB"
  const secondaryColor = organization?.secondary_color || "#1D4ED8"

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-4 gap-2 rounded-[26px] border border-slate-200 bg-slate-50/80 p-2 shadow-lg shadow-slate-900/5">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              className={cn(
                "flex min-w-0 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[11px] font-semibold tracking-tight transition-all",
                active ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
              )}
              href={item.href}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition-all",
                  active ? "text-white shadow-sm" : "bg-slate-100 text-slate-600"
                )}
                style={
                  active
                    ? { background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})` }
                    : undefined
                }
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
