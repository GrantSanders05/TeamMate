"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { createClient } from "@/lib/supabase/client"

export function OrganizationSettings() {
  const supabase = createClient()
  const { organization, refresh } = useOrgSafe()
  const [name, setName] = useState(organization?.name ?? "")
  const [logoUrl, setLogoUrl] = useState(organization?.logo_url ?? "")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(organization?.name ?? "")
    setLogoUrl(organization?.logo_url ?? "")
  }, [organization?.id, organization?.name, organization?.logo_url])

  async function save() {
    if (!organization) return

    setSaving(true)
    await supabase
      .from("organizations")
      .update({
        name: name.trim(),
        logo_url: logoUrl.trim() || null,
      })
      .eq("id", organization.id)

    await refresh()
    setSaving(false)
  }

  if (!organization) {
    return <div className="section-card text-sm text-slate-600">No organization selected.</div>
  }

  return (
    <section className="section-card space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Organization Settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          Core organization details are editable here. The join code stays stable unless you intentionally rotate it in the database.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="orgName">Name</Label>
          <Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-2xl" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgJoinCode">Join code</Label>
          <Input id="orgJoinCode" value={(organization.join_code || "").toUpperCase()} readOnly className="h-12 rounded-2xl font-mono tracking-[0.16em]" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL</Label>
        <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="h-12 rounded-2xl" />
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void save()} disabled={saving} className="rounded-2xl px-5">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </section>
  )
}
