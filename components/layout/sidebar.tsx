"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function Sidebar() {
  const pathname = usePathname()
  const { organization } = useOrgSafe()

  const items = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/employees", label: "Employees" },
    { href: "/history", label: "History" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <aside className="hidden md:flex md:w-64 border-r flex-col">
      <div className="p-4 border-b">
        <div className="text-xs text-gray-500">Organization</div>
        <div className="font-semibold">
          {organization?.name ?? "Teammate"}
        </div>
      </div>

      <nav className="flex flex-col p-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "font-semibold p-2" : "p-2"}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
