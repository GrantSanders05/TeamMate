"use client"

import { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Footer } from "@/components/layout/footer"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { buildBrandStyleVars } from "@/lib/branding"

export function AppShell({ children }: { children: ReactNode }) {
  const { organization } = useOrgSafe()
  const styleVars = buildBrandStyleVars(organization)

  return (
    <div className="min-h-screen bg-slate-100" style={styleVars}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1 px-3 pb-28 pt-3 md:px-6 md:pb-12 md:pt-6">
            <div className="mx-auto w-full max-w-[1600px]">{children}</div>
          </main>
          <div className="hidden md:block">
            <Footer />
          </div>
        </div>
      </div>
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  )
}

export default AppShell
