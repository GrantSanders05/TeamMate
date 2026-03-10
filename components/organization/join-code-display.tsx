"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, Link2, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"
import { useToast } from "@/components/ui/use-toast"

function normalizeJoinCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase()
}

export function JoinCodeDisplay() {
  const supabase = createClient()
  const { organization, isManager, refresh } = useOrg()
  const { toast } = useToast()

  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!organization?.id) {
      setJoinCode("")
      return
    }

    void loadJoinCode(organization.id)
  }, [organization?.id])

  async function loadJoinCode(orgId: string) {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from("organizations")
        .select("join_code")
        .eq("id", orgId)
        .single()

      if (error) throw error

      setJoinCode(normalizeJoinCode(data?.join_code))
    } catch (error) {
      console.error("Failed to load join code", error)
      setJoinCode("")
    } finally {
      setLoading(false)
    }
  }

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

  async function regenerateJoinCode() {
    if (!organization?.id || !isManager) return

    const confirmed = window.confirm(
      joinCode
        ? "Regenerate the join code? Anyone using the old code or link will need the new one."
        : "Generate a join code for this organization?"
    )

    if (!confirmed) return

    try {
      setSaving(true)

      const { data, error } = await supabase.rpc("regenerate_organization_join_code", {
        target_org_id: organization.id,
      })

      if (error) throw error

      const nextCode = normalizeJoinCode(typeof data === "string" ? data : "")
      if (!nextCode) {
        throw new Error("No join code was returned from the database.")
      }

      setJoinCode(nextCode)
      await refresh()

      toast({
        title: joinCode ? "Join code regenerated" : "Join code created",
        description: "Your organization now has a saved join code and share link.",
      })
    } catch (error) {
      toast({
        title: "Could not save join code",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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
            This card now reads directly from the organization record so the value stays after page changes and refreshes.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join code</p>
          <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-slate-900">
            {loading ? "Loading..." : joinCode || "------"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void copyText(joinCode, "Join code")} disabled={!joinCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>

            {isManager ? (
              <Button onClick={() => void regenerateJoinCode()} disabled={saving}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : joinCode ? "Regenerate" : "Generate"}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join link</p>
          <p className="mt-2 break-all text-sm text-slate-700">
            {joinLink || "Generate a join code to create a shareable link."}
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
