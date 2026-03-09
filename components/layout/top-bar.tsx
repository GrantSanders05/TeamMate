"use client"

import { useRouter } from "next/navigation"
import { ChevronDown, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"

export function TopBar({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { organization, memberships, setActiveOrg, refresh, isLoading } = useOrg()

  const safeMemberships = memberships ?? []
  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U"

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Active organization
          </div>
          <div className="truncate text-base font-semibold text-slate-900">
            {isLoading ? "Loading..." : organization?.name || "No organization selected"}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>

          {safeMemberships.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Switch Org
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {safeMemberships.map(({ org }) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => {
                      setActiveOrg(org.id)
                      router.refresh()
                    }}
                  >
                    {org.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open account menu">
                {initials}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => router.push("/profile")}>
                {userEmail || "Profile"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {safeMemberships.length > 1 ? (
                <DropdownMenuItem onClick={() => router.push("/select-org")}>
                  Select organization
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
