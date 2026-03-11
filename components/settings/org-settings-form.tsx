"use client"

import { useEffect, useMemo, useState } from "react"
import { Copy, RefreshCcw, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"
import { OrganizationThemePresets } from "@/components/settings/organization-theme-presets"
import { getOrgBranding } from "@/lib/branding"

export function OrgSettingsForm() {
  const supabase = createClient()
  const { organization, refresh, isManager } = useOrgSafe()
  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState("#2563EB")
  const [secondaryColor, setSecondaryColor] = useState("#0F172A")
  const [fontFamily, setFontFamily] = useState("Inter")
  const [saving, setSaving] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joinCodeBusy, setJoinCodeBusy] = useState(false)

  useEffect(() => {
    if (!organization) return
    setName(organization.name || "")
    setLogoUrl(organization.logo_url || "")
    setPrimaryColor(organization.primary_color || "#2563EB")
    setSecondaryColor(organization.secondary_color || "#0F172A")
    setFontFamily(organization.font_family || "Inter")
    setJoinCode((organization.join_code || "").trim().toUpperCase())
  }, [organization?.id, organization?.name, organization?.logo_url, organization?.primary_color, organization?.secondary_color, organization?.font_family, organization?.join_code])

  const brand = getOrgBranding({ primary_color: primaryColor, secondary_color: secondaryColor, font_family: fontFamily })
  const joinLink = useMemo(() => typeof window !== "undefined" && joinCode ? `${window.location.origin}/join/${joinCode}` : "", [joinCode])

  async function saveSettings() {
    if (!organization) return
    setSaving(true)
    const { error } = await supabase.from("organizations").update({
      name,
      logo_url: logoUrl || null,
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      font_family: fontFamily,
      updated_at: new Date().toISOString(),
    }).eq("id", organization.id)
    setSaving(false)
    if (error) return alert(error.message)
    await refresh()
    alert("Organization branding saved.")
  }

  async function regenerateJoinCode() {
    if (!organization) return
    setJoinCodeBusy(true)
    const { data, error } = await supabase.rpc("regenerate_organization_join_code", { target_org_id: organization.id })
    setJoinCodeBusy(false)
    if (error) return alert(error.message)
    setJoinCode(String(data || "").trim().toUpperCase())
    await refresh()
  }

  if (!organization) return <PageShell title="Organization Settings" subtitle="Update branding, settings, and invite tools."><SectionCard><p className="text-sm text-slate-600">No organization selected.</p></SectionCard></PageShell>
  if (!isManager) return <PageShell title="Organization Settings" subtitle="Update branding, settings, and invite tools."><SectionCard><p className="text-sm text-slate-600">Only managers can edit organization settings.</p></SectionCard></PageShell>

  return (
    <PageShell title="Organization Settings" subtitle="Manage branding, workspace identity, and invite tools.">
      <div className="space-y-6">
        <OrgBrandHeader />

        <SectionCard title="Brand Editor" description="Make the workspace feel like it belongs to your organization.">
          <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2"><Label htmlFor="org-name">Organization name</Label><Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="org-logo">Logo URL</Label><Input id="org-logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." /></div>
                <div className="space-y-2"><Label htmlFor="org-primary">Primary brand color</Label><div className="flex gap-3"><Input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-11 w-16 rounded border" /><Input id="org-primary" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} /></div></div>
                <div className="space-y-2"><Label htmlFor="org-secondary">Accent / dark color</Label><div className="flex gap-3"><Input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-11 w-16 rounded border" /><Input id="org-secondary" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} /></div></div>
                <div className="space-y-2 md:col-span-2"><Label htmlFor="org-font">Font family</Label><Input id="org-font" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} /></div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void saveSettings()} disabled={saving}>{saving ? "Saving..." : "Save Branding"}</Button>
              </div>

              <OrganizationThemePresets onApplyPreset={({ primary, secondary }) => { setPrimaryColor(primary); setSecondaryColor(secondary) }} />
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Brand Preview</p>
              <div className="mt-4 overflow-hidden rounded-[28px] border border-slate-900/10 p-5 text-white shadow-xl" style={{ background: `linear-gradient(135deg, ${brand.secondary} 0%, ${brand.secondary} 35%, ${brand.primary} 100%)`, fontFamily: brand.fontFamily }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10">
                    {logoUrl ? <img src={logoUrl} alt="Organization logo preview" className="h-full w-full object-cover" /> : <Building2 className="h-5 w-5 text-white/80" />}
                  </div>
                  <div><p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Workspace</p><h3 className="mt-1 text-2xl font-semibold text-white">{name || "Organization Name"}</h3></div>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Primary</p><p className="mt-2 text-base font-semibold">{primaryColor}</p></div>
                  <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Accent</p><p className="mt-2 text-base font-semibold">{secondaryColor}</p></div>
                  <div className="rounded-2xl bg-white/10 p-4"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Font</p><p className="mt-2 text-base font-semibold">{fontFamily}</p></div>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Team invite tools" description="Keep your join code stable, visible, and easy to share.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join Code</p><p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-slate-900">{joinCode || "------"}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={() => navigator.clipboard.writeText(joinCode)} disabled={!joinCode}><Copy className="mr-2 h-4 w-4" />Copy Join Code</Button><Button onClick={() => void regenerateJoinCode()} disabled={joinCodeBusy}><RefreshCcw className="mr-2 h-4 w-4" />{joinCodeBusy ? "Saving..." : joinCode ? "Regenerate Join Code" : "Generate Join Code"}</Button></div></div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join Link</p><p className="mt-2 break-all text-sm text-slate-700">{joinLink || "Generate a join code to create a shareable link."}</p><div className="mt-4"><Button variant="outline" onClick={() => navigator.clipboard.writeText(joinLink)} disabled={!joinLink}><Copy className="mr-2 h-4 w-4" />Copy Join Link</Button></div></div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}

export default OrgSettingsForm
