'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Archive, Settings, ClipboardList, CheckSquare } from 'lucide-react'
import { useOrg } from '@/lib/hooks/use-organization'
import { cn } from '@/lib/utils'

const managerNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/schedule', label: 'Schedules', icon: Calendar },
  { href: '/employees', label: 'Employees', icon: Users },
  { href: '/history', label: 'History', icon: Archive },
  { href: '/settings', label: 'Settings', icon: Settings },
]
const employeeNav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/availability', label: 'Availability', icon: CheckSquare },
  { href: '/my-schedule', label: 'My Schedule', icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()
  const { organization, isManager, isLoading } = useOrg()
  const navItems = isManager ? managerNav : employeeNav

  return (
    <aside className="hidden w-64 border-r bg-white md:flex md:flex-col">
      <div className="border-b p-4">
        <div className="text-lg font-semibold">{isLoading ? 'Loading...' : organization?.name || 'Teammate'}</div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm", active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
