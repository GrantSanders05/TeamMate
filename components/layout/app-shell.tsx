"use client"

import type { ReactNode } from "react"

import { AppFooter } from "@/components/layout/app-footer"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"
import { OrgProvider } from "@/lib/hooks/use-organization"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

function AppShellInner({
  children,
  userEmail,
}: {
  children: ReactNode
  userEmail: string
}) {
  const { organization } = useOrgSafe()
  const fontFamily = organization?.font_family || "Inter"
  const brandColor = organization?.primary_color || "#2563EB"
  const secondaryColor = organization?.secondary_color || "#1D4ED8"

  return (
    <div
      className="min-h-screen px-3 py-3 sm:px-4 sm:py-4"
      style={
        {
          fontFamily,
          ["--tm-brand" as string]: brandColor,
          ["--tm-brand-2" as string]: secondaryColor,
          ["--tm-brand-soft" as string]: `${brandColor}1F`,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1600px] app-shell-frame">
        <div className="grid min-h-[calc(100vh-2rem)] grid-cols-1 bg-slate-50/70 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="hidden border-r border-slate-200/80 bg-slate-50/70 lg:block">
            <Sidebar />
          </aside>

          <div className="flex min-w-0 flex-col">
            <TopBar />

            <main className="min-h-0 flex-1">
              {children}
            </main>

            <AppFooter />
          </div>
        </div>
      </div>

      <MobileNav />
    </div>
  )
}

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
      <AppShellInner userEmail={userEmail}>{children}</AppShellInner>
    </OrgProvider>
  )
}
