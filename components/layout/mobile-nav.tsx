"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function MobileNav() {
  const pathname = usePathname()

  const items = [
    { href: "/dashboard", label: "Home" },
    { href: "/employees", label: "Team" },
    { href: "/settings", label: "Settings" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white md:hidden">
      <div className="flex justify-around py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? "font-semibold" : ""}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
