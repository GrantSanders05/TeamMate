"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/employees", label: "Team" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
]

const employeeItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/availability", label: "Avail." },
  { href: "/my-schedule", label: "Schedule" },
  { href: "/profile", label: "Profile" },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isManager } = useOrgSafe()

  const items = isManager ? managerItems : employeeItems

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 backdrop-blur md:hidden">
      <div className={`grid ${items.length === 5 ? "grid-cols-5" : "grid-cols-4"} gap-1 px-2 py-2`}>
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "rounded-lg bg-slate-900 px-2 py-2 text-center text-xs font-medium text-white"
                  : "rounded-lg px-2 py-2 text-center text-xs font-medium text-slate-600"
              }
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
