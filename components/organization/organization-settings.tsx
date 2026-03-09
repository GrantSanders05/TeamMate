
"use client"

import { useState } from "react"
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

  async function save() {
    if (!organization) return

    setSaving(true)

    await supabase
      .from("organizations")
      .update({
        name,
        logo_url: logoUrl || null
      })
      .eq("id", organization.id)

    await refresh()
    setSaving(false)
  }

  if (!organization) return <div>No organization</div>

  return (
    <div className="border rounded-lg p-6 bg-white space-y-4">
      <h2 className="text-lg font-semibold">Organization Settings</h2>

      <div>
        <Label>Name</Label>
        <Input value={name} onChange={(e)=>setName(e.target.value)} />
      </div>

      <div>
        <Label>Logo URL</Label>
        <Input value={logoUrl} onChange={(e)=>setLogoUrl(e.target.value)} />
      </div>

      <Button onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
    </div>
  )
}
