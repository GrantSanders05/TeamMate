'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User, ChevronDown, Building2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'

export function TopBar({ userEmail, userId }: { userEmail: string; userId: string }) {
  const router = useRouter()
  const { organization, allOrgs, setActiveOrg } = useOrg()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail.charAt(0).toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-6 gap-4 shrink-0">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
          style={{ backgroundColor: organization?.primary_color || '#2563EB' }}
        >
          {organization?.name?.charAt(0) || 'T'}
        </div>
        <span className="font-semibold text-slate-900 text-sm">{organization?.name || 'Teammate'}</span>
      </div>

      <div className="flex-1" />

      {/* Org switcher (if multiple orgs) */}
      {allOrgs.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden md:flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              Switch org
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {allOrgs.map(({ org }) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => setActiveOrg(org.id)}
                className={org.id === organization?.id ? 'font-medium' : ''}
              >
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* User menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-700">
              {initials}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5">
            <p className="text-xs text-slate-500 truncate">{userEmail}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            <User className="w-4 h-4 mr-2" />
            Profile
          </DropdownMenuItem>
          {allOrgs.length > 1 && (
            <DropdownMenuItem onClick={() => router.push('/select-org')}>
              <Building2 className="w-4 h-4 mr-2" />
              Switch organization
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
            <LogOut className="w-4 h-4 mr-2" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
