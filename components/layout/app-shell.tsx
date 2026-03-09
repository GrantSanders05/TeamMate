"use client"

import type { ReactNode } from "react"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { OrgProvider } from "@/lib/hooks/use-organization"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

function AppShellInner({ children, userEmail }: { children: ReactNode; userEmail: string }) {
  const { organization } = useOrgSafe()
  const fontFamily = organization?.font_family || "Inter"
  return (
    <div style={{ fontFamily }}>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar userEmail={userEmail} />
          <main className="flex-1 px-4 py-4 pb-24 md:px-6 md:pb-6">{children}</main>
        </div>
      </div>
      <MobileNav />
    </div>
  )
}

export function AppShell({ children, userId, userEmail }: { children: ReactNode; userId: string; userEmail: string }) {
  return (
    <OrgProvider userId={userId}>
      <AppShellInner userEmail={userEmail}>{children}</AppShellInner>
    </OrgProvider>
  )
}
