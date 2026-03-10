"use client"

import { useMemo } from "react"
import { Copy, Link2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useOrg } from "@/lib/hooks/use-organization"
import { useToast } from "@/components/ui/use-toast"

export function JoinCodeDisplay() {
  const { organization } = useOrg()
  const { toast } = useToast()

  const joinCode = (organization?.join_code || "").toUpperCase()

  const joinLink = useMemo(() => {
    if (!organization || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${joinCode}`
  }, [organization, joinCode])

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

  if (!organization) return null

  return (
    <section className="section-card space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">Invite your team</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Join code and share link</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Your organization join code stays stable so employees can keep using the same code and link.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" /> Stable code
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Join code</p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-2xl font-bold tracking-[0.22em] text-slate-950">
            {joinCode}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copyText(joinCode, "Join code") }>
              <Copy className="mr-2 h-4 w-4" />
              Copy code
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Join link</p>
          <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 break-all">
            {joinLink || "Unavailable until the page is fully loaded"}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copyText(joinLink, "Join link") } disabled={!joinLink}>
              <Link2 className="mr-2 h-4 w-4" />
              Copy link
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
