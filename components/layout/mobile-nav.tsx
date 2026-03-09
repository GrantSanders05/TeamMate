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
  { href: '/my-schedule', label: 'My Schedule', icon: ClipboardList },
]

export function MobileNav() {
  const pathname = usePathname()
  const { isManager, organization } = useOrg()
  const navItems = isManager ? managerNav : employeeNav

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
      <div className="flex">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors',
                active ? 'text-blue-600' : 'text-slate-500'
              )}
              style={active ? { color: organization?.primary_color || '#2563EB' } : {}}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
