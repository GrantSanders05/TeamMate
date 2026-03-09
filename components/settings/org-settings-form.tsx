"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { OrganizationThemePresets } from "@/components/settings/organization-theme-presets"

export function OrgSettingsForm() {
  const supabase = createClient()
  const { organization, refresh, isManager } = useOrgSafe()

  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#2563EB")
  const [secondaryColor, setSecondaryColor] = useState("#1E40AF")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [joinCode, setJoinCode] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!organization) return
    setName(organization.name || "")
    setLogoUrl(organization.logo_url || "")
    setPrimaryColor(organization.primary_color || "#2563EB")
    setSecondaryColor(organization.secondary_color || "#1E40AF")
    setFontFamily(organization.font_family || "Inter")
    setJoinCode(organization.join_code || "")
  }, [organization?.id])

  async function saveSettings() {
    if (!organization) return
    setSaving(true)

    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        logo_url: logoUrl || null,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        font_family: fontFamily,
        updated_at: new Date().toISOString(),
      })
      .eq("id", organization.id)

    setSaving(false)

    if (error) {
      alert(error.message)
      return
    }

    await refresh()
    alert("Organization settings saved.")
  }

  async function regenerateJoinCode() {
    if (!organization) return
    const newCode = Math.random().toString(36).slice(2, 8).toUpperCase()

    const { error } = await supabase
      .from("organizations")
      .update({ join_code: newCode })
      .eq("id", organization.id)

    if (error) {
      alert(error.message)
      return
    }

    setJoinCode(newCode)
    await refresh()
    alert("Join code regenerated.")
  }

  if (!organization) {
    return <div className="rounded-3xl border bg-white p-6 shadow-sm">No organization selected.</div>
  }

  if (!isManager) {
    return <div className="rounded-3xl border bg-white p-6 shadow-sm">Only managers can edit organization settings.</div>
  }

  return (
    <PageShell>
      <OrgBrandHeader
        title={`${organization.name} Settings`}
        subtitle="Customize your organization branding, join settings, and visual identity."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <SectionCard title="Organization Profile">
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization name</Label>
                <Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <Input id="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary color</Label>
                  <Input id="secondaryColor" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                </div>
              </div>

              <div>
                <Label htmlFor="fontFamily">Font family</Label>
                <Input id="fontFamily" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} />
              </div>

              <Button onClick={() => void saveSettings()} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </SectionCard>

          <OrganizationThemePresets
            onApply={(primary, secondary) => {
              setPrimaryColor(primary)
              setSecondaryColor(secondary)
            }}
          />
        </div>

        <div className="space-y-6">
          <SectionCard title="Join Settings" description="Share this code so employees can join your organization.">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Join Code</div>
              <div className="mt-2 text-3xl font-semibold tracking-widest text-slate-900">{joinCode}</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(joinCode)}>
                Copy Join Code
              </Button>
              <Button variant="outline" onClick={() => void regenerateJoinCode()}>
                Regenerate Join Code
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
