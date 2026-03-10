"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { OrganizationThemePresets } from "@/components/settings/organization-theme-presets"
import { generateJoinCode } from "@/lib/utils"

function normalizeJoinCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase()
}

export function OrgSettingsForm() {
  const supabase = createClient()
  const { organization, refresh, isManager } = useOrgSafe()

  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#2563EB")
  const [secondaryColor, setSecondaryColor] = useState("#1E40AF")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [saving, setSaving] = useState(false)
  const [regeneratingCode, setRegeneratingCode] = useState(false)

  const joinCode = normalizeJoinCode(organization?.join_code)
  const joinLink = useMemo(() => {
    if (!joinCode || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${joinCode}`
  }, [joinCode])

  useEffect(() => {
    if (!organization) {
      setName("")
      setLogoUrl("")
      setPrimaryColor("#2563EB")
      setSecondaryColor("#1E40AF")
      setFontFamily("Inter")
      return
    }

    setName(organization.name || "")
    setLogoUrl(organization.logo_url || "")
    setPrimaryColor(organization.primary_color || "#2563EB")
    setSecondaryColor(organization.secondary_color || "#1E40AF")
    setFontFamily(organization.font_family || "Inter")
  }, [
    organization?.id,
    organization?.name,
    organization?.logo_url,
    organization?.primary_color,
    organization?.secondary_color,
    organization?.font_family,
  ])

  async function generateUniqueJoinCode(currentOrgId: string) {
    let candidate = normalizeJoinCode(generateJoinCode())

    while (true) {
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("join_code", candidate)
        .maybeSingle()

      if (!data || data.id === currentOrgId) {
        return candidate
      }

      candidate = normalizeJoinCode(generateJoinCode())
    }
  }

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

    try {
      setRegeneratingCode(true)

      const newCode = await generateUniqueJoinCode(organization.id)

      const { error } = await supabase
        .from("organizations")
        .update({
          join_code: newCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organization.id)

      if (error) {
        throw error
      }

      await refresh()
      alert("Join code regenerated.")
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not regenerate join code.")
    } finally {
      setRegeneratingCode(false)
    }
  }

  async function copyJoinCode() {
    if (!joinCode) return
    await navigator.clipboard.writeText(joinCode)
  }

  if (!organization) {
    return (
      <PageShell title="Organization Settings" subtitle="Update branding, settings, and invite tools.">
        <SectionCard>
          <p className="text-sm text-slate-600">No organization selected.</p>
        </SectionCard>
      </PageShell>
    )
  }

  if (!isManager) {
    return (
      <PageShell title="Organization Settings" subtitle="Update branding, settings, and invite tools.">
        <SectionCard>
          <p className="text-sm text-slate-600">Only managers can edit organization settings.</p>
        </SectionCard>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Organization Settings"
      subtitle="Manage your organization details, branding, and invite tools from one place."
    >
      <div className="space-y-6">
        <OrgBrandHeader />

        <SectionCard title="Branding" description="Keep your organization profile polished and consistent.">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization name</Label>
              <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-logo">Logo URL</Label>
              <Input
                id="org-logo"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-primary">Primary color</Label>
              <Input id="org-primary" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-secondary">Secondary color</Label>
              <Input id="org-secondary" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="org-font">Font family</Label>
              <Input id="org-font" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => void saveSettings()} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </Button>
          </div>

          <div className="mt-6">
            <OrganizationThemePresets
              onApplyPreset={({ primary, secondary }) => {
                setPrimaryColor(primary)
                setSecondaryColor(secondary)
              }}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Team invite tools"
          description="Make sure your join code stays visible, saved, and easy to share."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join Code</p>
              <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-slate-900">
                {joinCode || "------"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void copyJoinCode()} disabled={!joinCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Join Code
                </Button>
                <Button onClick={() => void regenerateJoinCode()} disabled={regeneratingCode}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {regeneratingCode ? "Regenerating..." : joinCode ? "Regenerate Join Code" : "Generate Join Code"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join Link</p>
              <p className="mt-2 break-all text-sm text-slate-700">
                {joinLink || "Unavailable until the page is fully loaded"}
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}
