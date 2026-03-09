'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Calendar, Users, Archive, ClipboardList, CheckSquare } from 'lucide-react'
import { useOrg } from '@/lib/hooks/use-organization'
import { cn } from '@/lib/utils'

const managerNav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/employees', label: 'Team', icon: Users },
  { href: '/history', label: 'History', icon: Archive },
]
const employeeNav = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/availability', label: 'Availability', icon: CheckSquare },
  { href: '/my-schedule', label: 'Schedule', icon: ClipboardList },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isManager } = useOrg()
  const navItems = isManager ? managerNav : employeeNav

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white p-2 md:hidden">
      <div className="grid grid-cols-4 gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link key={item.href} href={item.href} className={cn("flex flex-col items-center justify-center rounded-md py-2 text-xs", active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
