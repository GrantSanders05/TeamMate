"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Home" },
  { href: "/my-schedule", label: "Schedule" },
  { href: "/employees", label: "Employees" },
  { href: "/settings", label: "Settings" },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="lg:hidden">
      <nav className="app-surface fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-2 p-2">
        {links.map((link) => {
          const active =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname?.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-2xl px-3 py-2 text-center text-xs font-semibold transition ${
                active
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
