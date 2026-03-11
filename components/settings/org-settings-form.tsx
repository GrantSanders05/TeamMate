"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Copy, Link2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useOrg } from "@/lib/hooks/use-organization"
import { useToast } from "@/components/ui/use-toast"
import { generateUniqueJoinCode } from "@/lib/organization/join-code"

export function OrgSettingsForm() {
  const supabase = createClient()
  const { organization, refresh } = useOrg()
  const { toast } = useToast()

  const [loading, setLoading] = useState(false)
  const bootstrappedRef = useRef(false)

  const joinCode = organization?.join_code?.trim() || ""

  const joinLink = useMemo(() => {
    if (!joinCode || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${joinCode}`
  }, [joinCode])

  async function persistJoinCode(mode: "generate" | "regenerate") {
    if (!organization) return

    setLoading(true)

    try {
      const nextCode = await generateUniqueJoinCode(supabase, organization.id)
      const { error } = await supabase
        .from("organizations")
        .update({ join_code: nextCode })
        .eq("id", organization.id)

      if (error) {
        throw new Error(error.message)
      }

      await refresh()

      toast({
        title: mode === "generate" ? "Join code created" : "Join code regenerated",
        description:
          mode === "generate"
            ? `Stable join code ${nextCode} is now saved for ${organization.name}.`
            : `New join code ${nextCode} is now active for ${organization.name}.`,
      })
    } catch (error) {
      toast({
        title: "Could not update join code",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function copyJoinLink() {
    if (!joinLink) return

    try {
      await navigator.clipboard.writeText(joinLink)
      toast({
        title: "Join link copied",
        description: "Employees can now use the copied link to join your organization.",
      })
    } catch {
      toast({
        title: "Could not copy join link",
        description: "Please copy the link manually.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!organization?.id || joinCode || bootstrappedRef.current) return

    bootstrappedRef.current = true
    void persistJoinCode("generate")
  }, [organization?.id, joinCode])

  return (
    <section className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Join Code</h2>
          <p className="mt-1 text-sm text-slate-500">
            This code stays the same until you explicitly regenerate it.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={copyJoinLink}
            disabled={!joinLink || loading}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy Join Link
          </Button>

          <Button type="button" onClick={() => void persistJoinCode(joinCode ? "regenerate" : "generate")} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {loading
              ? joinCode
                ? "Regenerating..."
                : "Generating..."
              : joinCode
                ? "Regenerate Join Code"
                : "Generate Join Code"}
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Current code
          </div>
          <div className="mt-3 font-mono text-3xl font-semibold tracking-[0.28em] text-slate-900">
            {joinCode || "------"}
          </div>
          <div className="mt-3 text-xs text-slate-500">
            Stable on refresh. Changes only when you regenerate it.
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Link2 className="h-4 w-4" />
            Join link
          </div>
          <div className="mt-3 break-all rounded-xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-700">
            {joinLink || "A join link will appear here after the code is generated."}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Regenerating the code invalidates the old link and activates the new one.
          </p>
        </div>
      </div>
    </section>
  )
}
