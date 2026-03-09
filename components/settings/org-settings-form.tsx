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

type ShiftTypeRow = {
  id: string
  name: string
  start_time: string
  end_time: string
  color: string
  required_workers: number
  is_active: boolean
}

const FONT_OPTIONS = ["Inter", "Plus Jakarta Sans", "DM Sans", "Outfit"]

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

  const [shiftTypes, setShiftTypes] = useState<ShiftTypeRow[]>([])
  const [shiftTypeName, setShiftTypeName] = useState("")
  const [shiftTypeStart, setShiftTypeStart] = useState("09:00")
  const [shiftTypeEnd, setShiftTypeEnd] = useState("17:00")
  const [shiftTypeColor, setShiftTypeColor] = useState("#2563EB")
  const [shiftTypeWorkers, setShiftTypeWorkers] = useState("1")
  const [editingShiftTypeId, setEditingShiftTypeId] = useState<string | null>(null)

  useEffect(() => {
    if (!organization) return
    setName(organization.name || "")
    setLogoUrl(organization.logo_url || "")
    setPrimaryColor(organization.primary_color || "#2563EB")
    setSecondaryColor(organization.secondary_color || "#1E40AF")
    setFontFamily(organization.font_family || "Inter")
    setJoinCode(organization.join_code || "")
    void loadShiftTypes(organization.id)
  }, [organization?.id])

  async function loadShiftTypes(orgId: string) {
    const { data, error } = await supabase
      .from("shift_types")
      .select("id, name, start_time, end_time, color, required_workers, is_active")
      .eq("organization_id", orgId)
      .order("name")
    if (error) return console.error(error)
    setShiftTypes((data as ShiftTypeRow[]) || [])
  }

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
    alert("Organization settings saved.")
  }

  async function regenerateJoinCode() {
    if (!organization) return
    const newCode = Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase.from("organizations").update({ join_code: newCode }).eq("id", organization.id)
    if (error) return alert(error.message)
    setJoinCode(newCode)
    await refresh()
    alert("Join code regenerated.")
  }

  function resetShiftTypeForm() {
    setEditingShiftTypeId(null)
    setShiftTypeName("")
    setShiftTypeStart("09:00")
    setShiftTypeEnd("17:00")
    setShiftTypeColor("#2563EB")
    setShiftTypeWorkers("1")
  }

  async function saveShiftType() {
    if (!organization || !shiftTypeName.trim()) return alert("Please enter a shift type name.")
    const payload = {
      organization_id: organization.id,
      name: shiftTypeName.trim(),
      start_time: shiftTypeStart,
      end_time: shiftTypeEnd,
      color: shiftTypeColor,
      required_workers: Number(shiftTypeWorkers || "1"),
      is_active: true,
    }
    let error = null
    if (editingShiftTypeId) error = (await supabase.from("shift_types").update(payload).eq("id", editingShiftTypeId)).error
    else error = (await supabase.from("shift_types").insert(payload)).error
    if (error) return alert(error.message)
    resetShiftTypeForm()
    await loadShiftTypes(organization.id)
  }

  async function toggleShiftTypeActive(shiftType: ShiftTypeRow) {
    if (!organization) return
    const { error } = await supabase.from("shift_types").update({ is_active: !shiftType.is_active }).eq("id", shiftType.id)
    if (error) return alert(error.message)
    await loadShiftTypes(organization.id)
  }

  function editShiftType(shiftType: ShiftTypeRow) {
    setEditingShiftTypeId(shiftType.id)
    setShiftTypeName(shiftType.name)
    setShiftTypeStart(shiftType.start_time)
    setShiftTypeEnd(shiftType.end_time)
    setShiftTypeColor(shiftType.color || "#2563EB")
    setShiftTypeWorkers(String(shiftType.required_workers || 1))
  }

  if (!organization) return <div className="rounded-3xl border bg-white p-6 shadow-sm">No organization selected.</div>
  if (!isManager) return <div className="rounded-3xl border bg-white p-6 shadow-sm">Only managers can edit organization settings.</div>

  return (
    <PageShell>
      <OrgBrandHeader title={`${organization.name} Settings`} subtitle="Customize branding, join settings, font choice, and reusable shift templates." />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <SectionCard title="Organization Profile">
            <div className="space-y-4">
              <div><Label htmlFor="orgName">Organization name</Label><Input id="orgName" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><Label htmlFor="logoUrl">Logo URL</Label><Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." /></div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="primaryColor">Primary color</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input id="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-11 w-16 rounded border" />
                    <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondaryColor">Secondary color</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input id="secondaryColor" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="h-11 w-16 rounded border" />
                    <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="fontFamily">Font family</Label>
                <select id="fontFamily" className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={fontFamily} onChange={(e) => setFontFamily(e.target.value)}>
                  {FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
                </select>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" style={{ fontFamily }}>
                <div className="h-2 w-full rounded-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
                <div className="mt-4 text-lg font-semibold text-slate-900">Brand Preview</div>
                <div className="mt-1 text-sm text-slate-600">This is how your colors and font will feel across the app.</div>
                <button type="button" className="mt-4 rounded-xl px-4 py-2 text-sm font-medium text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>Example Button</button>
              </div>
              <Button onClick={() => void saveSettings()} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
            </div>
          </SectionCard>
          <OrganizationThemePresets onApply={(primary, secondary) => { setPrimaryColor(primary); setSecondaryColor(secondary) }} />
          <SectionCard title="Shift Templates" description="Create reusable shifts with built-in colors so your schedule cards keep their visual styling.">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label>Template name</Label><Input value={shiftTypeName} onChange={(e) => setShiftTypeName(e.target.value)} placeholder="Morning Shift" /></div>
                <div><Label>Required workers</Label><Input type="number" min="1" value={shiftTypeWorkers} onChange={(e) => setShiftTypeWorkers(e.target.value)} /></div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div><Label>Start time</Label><Input type="time" value={shiftTypeStart} onChange={(e) => setShiftTypeStart(e.target.value)} /></div>
                <div><Label>End time</Label><Input type="time" value={shiftTypeEnd} onChange={(e) => setShiftTypeEnd(e.target.value)} /></div>
                <div>
                  <Label>Shift color</Label>
                  <div className="mt-1 flex items-center gap-3">
                    <input type="color" value={shiftTypeColor} onChange={(e) => setShiftTypeColor(e.target.value)} className="h-11 w-16 rounded border" />
                    <Input value={shiftTypeColor} onChange={(e) => setShiftTypeColor(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void saveShiftType()}>{editingShiftTypeId ? "Update Template" : "Add Template"}</Button>
                {editingShiftTypeId ? <Button variant="outline" onClick={resetShiftTypeForm}>Cancel Edit</Button> : null}
              </div>
              <div className="space-y-3">
                {shiftTypes.length === 0 ? <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">No shift templates yet.</div> : shiftTypes.map((shiftType) => (
                  <div key={shiftType.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border" style={{ backgroundColor: shiftType.color || "#2563EB" }} />
                        <div>
                          <div className="font-medium text-slate-900">{shiftType.name}</div>
                          <div className="mt-1 text-sm text-slate-600">{shiftType.start_time} - {shiftType.end_time} · {shiftType.required_workers} worker(s)</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => editShiftType(shiftType)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => void toggleShiftTypeActive(shiftType)}>{shiftType.is_active ? "Deactivate" : "Activate"}</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
        <div className="space-y-6">
          <SectionCard title="Join Settings" description="Share this code so employees can join your organization.">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-[11px] uppercase tracking-wide text-slate-500">Join Code</div>
              <div className="mt-2 text-3xl font-semibold tracking-widest text-slate-900">{joinCode}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigator.clipboard.writeText(joinCode)}>Copy Join Code</Button>
              <Button variant="outline" onClick={() => void regenerateJoinCode()}>Regenerate Join Code</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </PageShell>
  )
}
