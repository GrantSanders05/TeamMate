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
      <div className="min-h-screen bg-slate-50 md:flex">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <TopBar userId={userId} userEmail={userEmail} />
          <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6">{children}</main>
        </div>
        <MobileNav />
      </div>
    </OrgProvider>
  )
}
