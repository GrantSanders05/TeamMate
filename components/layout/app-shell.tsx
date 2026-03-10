"use client"

import type { ReactNode } from "react"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { OrgProvider } from "@/lib/hooks/use-organization"

export function AppShell({
  children,
  userId,
  userEmail,
}: {
  children: ReactNode
  userId: string
  userEmail: string
}) {
  return (
    <OrgProvider userId={userId}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-[1600px]">
          <aside className="hidden border-r border-slate-200 bg-white lg:block lg:w-72">
            <Sidebar />
          </aside>

          <div className="flex min-h-screen min-w-0 flex-1 flex-col">
            <TopBar userEmail={userEmail} />
            <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>

        <div className="lg:hidden">
          <MobileNav />
        </div>
      </div>
    </OrgProvider>
  )
}
