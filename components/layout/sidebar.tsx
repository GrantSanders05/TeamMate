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
  { href: '/availability', label: 'Available Shifts', icon: CheckSquare },
  { href: '/my-schedule', label: 'My Schedule', icon: ClipboardList },
]

export function Sidebar() {
  const pathname = usePathname()
  const { organization, isManager, isLoading } = useOrg()

  const navItems = isManager ? managerNav : employeeNav

  return (
    <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {organization?.logo_url ? (
            <img src={organization.logo_url} alt={organization.name} className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: organization?.primary_color || '#2563EB' }}
            >
              {organization?.name?.charAt(0) || 'T'}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-slate-900 text-sm truncate">
              {isLoading ? 'Loading...' : (organization?.name || 'Teammate')}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              style={active ? { backgroundColor: `${organization?.primary_color}15`, color: organization?.primary_color } : {}}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Profile link */}
      <div className="p-3 border-t border-slate-100">
        <Link
          href="/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            pathname === '/profile' && 'bg-slate-50 text-slate-900'
          )}
        >
          <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600">
            P
          </div>
          Profile
        </Link>
      </div>
    </aside>
  )
}
