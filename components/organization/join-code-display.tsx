"use client"

import { useMemo } from "react"
import { Copy, Link2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"
import { useToast } from "@/components/ui/use-toast"

function createJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  return code
}

export function JoinCodeDisplay() {
  const supabase = createClient()
  const { organization, isManager, refresh } = useOrg()
  const { toast } = useToast()

  const joinLink = useMemo(() => {
    if (!organization || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${organization.join_code}`
  }, [organization])

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast({
        title: `${label} copied`,
        description: `${label} was copied to your clipboard.`,
      })
    } catch {
      toast({
        title: `Could not copy ${label.toLowerCase()}`,
        description: "Please copy it manually.",
        variant: "destructive",
      })
    }
  }

  async function regenerateJoinCode() {
    if (!organization || !isManager) return

    const confirmed = window.confirm(
      "Regenerate the join code? Anyone using the old code or link will need the new one."
    )
    if (!confirmed) return

    try:
      let nextCode = createJoinCode()

      while (true) {
        const { data } = await supabase
          .from("organizations")
          .select("id")
          .eq("join_code", nextCode)
          .maybeSingle()

        if (!data || data.id === organization.id) break
        nextCode = createJoinCode()
      }

      const { error } = await supabase
        .from("organizations")
        .update({ join_code: nextCode })
        .eq("id", organization.id)

      if (error) throw error

      await refresh()

      toast({
        title: "Join code regenerated",
        description: "Your organization now has a new join code and link.",
      })
    } catch (error) {
      toast({
        title: "Could not regenerate join code",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }

  if (!organization) return null

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm font-medium text-slate-500">Invite your team</div>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Join code and share link
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Share the code verbally or send the direct join link to new team members.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:min-w-[540px]">
          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Join code
            </div>
            <div className="mt-2 text-3xl font-bold tracking-[0.18em] text-slate-900">
              {organization.join_code}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => copyText(organization.join_code, "Join code")}>
                <Copy className="mr-2 h-4 w-4" />
                Copy code
              </Button>

              {isManager ? (
                <Button size="sm" variant="outline" onClick={regenerateJoinCode}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Regenerate
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-4">
            <div className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
              Join link
            </div>
            <div className="mt-2 truncate text-sm text-slate-700">
              {joinLink || "Unavailable until the page is fully loaded"}
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                disabled={!joinLink}
                onClick={() => copyText(joinLink, "Join link")}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Copy link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
