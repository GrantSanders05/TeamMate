"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const managerLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/schedule/new", label: "New Schedule" },
  { href: "/employees", label: "Employees" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
  { href: "/profile", label: "Profile" },
];

const employeeLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-schedule", label: "My Schedule" },
  { href: "/profile", label: "Profile" },
];

export function Sidebar({
  orgName,
  isManager,
}: {
  orgName?: string;
  isManager?: boolean;
}) {
  const pathname = usePathname();
  const links = isManager ? managerLinks : employeeLinks;

  return (
    <aside className="hidden lg:flex lg:w-72 lg:flex-col">
      <div className="app-surface pretty-scrollbar sticky top-4 flex h-[calc(100vh-2rem)] flex-col overflow-y-auto p-4">
        <div className="rounded-2xl bg-slate-950 px-4 py-4 text-white">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
            TeamMate
          </p>
          <p className="mt-2 text-lg font-semibold">{orgName || "Workspace"}</p>
          <p className="mt-1 text-sm text-slate-300">
            {isManager ? "Manager workspace" : "Employee workspace"}
          </p>
        </div>

        <nav className="mt-6 flex flex-1 flex-col gap-2">
          {links.map((link) => {
            const active =
              pathname === link.href ||
              (link.href !== "/dashboard" && pathname?.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-950">Cleaner scheduling</p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Professional layout, calmer spacing, and a better-looking dashboard shell.
          </p>
        </div>
      </div>
    </aside>
  );
}
