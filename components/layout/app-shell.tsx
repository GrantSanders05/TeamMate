'use client'

import { OrgProvider } from '@/lib/hooks/use-organization'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { MobileNav } from '@/components/layout/mobile-nav'

export function AppShell({
  children,
  userId,
  userEmail,
}: {
  children: React.ReactNode
  userId: string
  userEmail: string
}) {
  return (
    <OrgProvider userId={userId}>
      <div className="min-h-screen bg-slate-50 flex">
        {/* Desktop sidebar */}
        <Sidebar />
        
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar userEmail={userEmail} userId={userId} />
          <main className="flex-1 overflow-auto pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </OrgProvider>
  )
}
