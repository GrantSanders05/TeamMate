"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

const managerItems = [
  { href: "/dashboard", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/employees", label: "Team" },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-6px_24px_rgba(15,23,42,0.06)]">
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-xl px-2 py-2 text-center text-xs font-medium transition",
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
              ].join(" ")}
            >
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
