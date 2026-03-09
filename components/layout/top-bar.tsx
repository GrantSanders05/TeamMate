"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { createClient } from "@/lib/supabase/client"

export function TopBar({ userEmail }: { userEmail: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { organization, memberships, isLoading } = useOrgSafe()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const orgName = isLoading
    ? "Loading..."
    : organization?.name ?? "No organization"

  return (
    <header className="border-b px-4 py-3 flex justify-between items-center">
      <div>
        <div className="text-xs text-gray-500">Active organization</div>
        <div className="font-semibold">{orgName}</div>
      </div>

      <div className="flex gap-2 items-center">
        {memberships.length > 1 && (
          <Button onClick={() => router.push("/select-org")}>
            Switch Org
          </Button>
        )}

        <Button variant="outline" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
