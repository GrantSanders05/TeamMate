"use client"

import { useMemo, useState } from "react"
import { Copy, Link2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"
import { useToast } from "@/components/ui/use-toast"
import { generateJoinCode } from "@/lib/utils"

export function JoinCodeDisplay() {
  const supabase = createClient()
  const { organization, isManager, refresh } = useOrg()
  const { toast } = useToast()
  const [isRegenerating, setIsRegenerating] = useState(false)

  const joinCode = organization?.join_code?.trim().toUpperCase() || ""

  const joinLink = useMemo(() => {
    if (!joinCode || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${joinCode}`
  }, [joinCode])

  async function copyText(value: string, label: string) {
    if (!value) return

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

  async function generateUniqueJoinCode(currentOrgId: string) {
    let nextCode = generateJoinCode().toUpperCase()

    while (true) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("join_code", nextCode)
        .maybeSingle()

      if (!data || data.id === currentOrgId) return nextCode

      nextCode = generateJoinCode().toUpperCase()
    }
  }

  async function regenerateJoinCode() {
    if (!organization || !isManager) return

    const confirmed = window.confirm(
      "Regenerate the join code? Anyone using the old code or link will need the new one."
    )

    if (!confirmed) return

    try {
      setIsRegenerating(true)

      const nextCode = await generateUniqueJoinCode(organization.id)

      const { error } = await supabase
        .from("organizations")
        .update({
          join_code: nextCode,
          updated_at: new Date().toISOString(),
        })
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
    } finally {
      setIsRegenerating(false)
    }
  }

  if (!organization) return null

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-700">
          <Link2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">Invite your team</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">Join code and share link</h3>
          <p className="mt-2 text-sm text-slate-600">
            Share the code verbally or send the direct join link to new team members.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join code</p>
          <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-slate-900">
            {joinCode || "------"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void copyText(joinCode, "Join code")} disabled={!joinCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>

            {isManager ? (
              <Button onClick={() => void regenerateJoinCode()} disabled={isRegenerating}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {isRegenerating ? "Regenerating..." : "Regenerate"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join link</p>
          <p className="mt-2 break-all text-sm text-slate-700">
            {joinLink || "Unavailable until the page is fully loaded"}
          </p>

          <div className="mt-4">
            <Button variant="outline" onClick={() => void copyText(joinLink, "Join link")} disabled={!joinLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
