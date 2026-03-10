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

  const [shiftTypes, setShiftTypes] = useState<ShiftTypeRow[]>([])
  const [shiftTypeName, setShiftTypeName] = useState("")
  const [shiftTypeStart, setShiftTypeStart] = useState("09:00")
  const [shiftTypeEnd, setShiftTypeEnd] = useState("17:00")
  const [shiftTypeColor, setShiftTypeColor] = useState("#2563EB")
  const [shiftTypeWorkers, setShiftTypeWorkers] = useState("1")
  const [editingShiftTypeId, setEditingShiftTypeId] = useState<string | null>(null)

  const [joinCode, setJoinCode] = useState("")
  const [joinCodeLoading, setJoinCodeLoading] = useState(false)
  const [joinCodeBusy, setJoinCodeBusy] = useState(false)

  const joinLink = useMemo(() => {
    if (!joinCode || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${joinCode}`
  }, [joinCode])

  useEffect(() => {
    if (!organization) return

    setName(organization.name || "")
    setLogoUrl(organization.logo_url || "")
    setPrimaryColor(organization.primary_color || "#2563EB")
    setSecondaryColor(organization.secondary_color || "#1E40AF")
    setFontFamily(organization.font_family || "Inter")

    void loadShiftTypes(organization.id)
    void loadJoinCode(organization.id)
  }, [
    organization?.id,
    organization?.name,
    organization?.logo_url,
    organization?.primary_color,
    organization?.secondary_color,
    organization?.font_family,
  ])

  async function loadShiftTypes(orgId: string) {
    const { data, error } = await supabase
      .from("shift_types")
      .select("id, name, start_time, end_time, color, required_workers, is_active")
      .eq("organization_id", orgId)
      .order("name")

    if (error) {
      console.error(error)
      return
    }

    setShiftTypes((data as ShiftTypeRow[]) || [])
  }

  async function loadJoinCode(orgId: string) {
    try {
      setJoinCodeLoading(true)

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
      setJoinCodeLoading(false)
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
      setJoinCodeBusy(true)

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
      alert(joinCode ? "Join code regenerated." : "Join code created.")
    } catch (error) {
      console.error(error)
      alert(error instanceof Error ? error.message : "Could not save join code.")
    } finally {
      setJoinCodeBusy(false)
    }
  }

  async function copyJoinCode() {
    if (!joinCode) return
    await navigator.clipboard.writeText(joinCode)
  }

  async function copyJoinLink() {
    if (!joinLink) return
    await navigator.clipboard.writeText(joinLink)
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
    if (!organization || !shiftTypeName.trim()) {
      alert("Please enter a shift type name.")
      return
    }

    const payload = {
      organization_id: organization.id,
      name: shiftTypeName.trim(),
      start_time: shiftTypeStart,
      end_time: shiftTypeEnd,
      color: shiftTypeColor,
      required_workers: Number(shiftTypeWorkers || "1"),
      is_active: true,
    }

    let error: { message: string } | null = null

    if (editingShiftTypeId) {
      error = (
        await supabase
          .from("shift_types")
          .update(payload)
          .eq("id", editingShiftTypeId)
      ).error
    } else {
      error = (await supabase.from("shift_types").insert(payload)).error
    }

    if (error) {
      alert(error.message)
      return
    }

    resetShiftTypeForm()
    await loadShiftTypes(organization.id)
  }

  async function toggleShiftTypeActive(shiftType: ShiftTypeRow) {
    if (!organization) return

    const { error } = await supabase
      .from("shift_types")
      .update({ is_active: !shiftType.is_active })
      .eq("id", shiftType.id)

    if (error) {
      alert(error.message)
      return
    }

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
      subtitle="Manage your organization details, branding, templates, and invite tools from one place."
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
              <div className="flex gap-3">
                <Input
                  id="org-primary-picker"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-11 w-16 rounded border"
                />
                <Input
                  id="org-primary"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-secondary">Secondary color</Label>
              <div className="flex gap-3">
                <Input
                  id="org-secondary-picker"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-11 w-16 rounded border"
                />
                <Input
                  id="org-secondary"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="org-font">Font family</Label>
              <select
                id="org-font"
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font} value={font}>
                    {font}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-900">Brand Preview</p>
            <p className="mt-1 text-sm text-slate-600">
              This is how your colors and font will feel across the app.
            </p>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div
                className="rounded-2xl p-4 text-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`, fontFamily }}
              >
                <p className="text-sm font-medium opacity-90">{name || "Organization Name"}</p>
                <h3 className="mt-1 text-xl font-semibold">Scheduling Dashboard</h3>
                <p className="mt-2 text-sm opacity-90">Simple, polished, and branded to your team.</p>
                <div className="mt-4">
                  <Button type="button" className="bg-white text-slate-900 hover:bg-slate-100">
                    Example Button
                  </Button>
                </div>
              </div>
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

        <SectionCard title="Shift Templates" description="Build reusable shifts so schedule creation is faster.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-2 xl:col-span-2">
              <Label htmlFor="shift-template-name">Template name</Label>
              <Input
                id="shift-template-name"
                value={shiftTypeName}
                onChange={(e) => setShiftTypeName(e.target.value)}
                placeholder="Morning Shift"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-workers">Required workers</Label>
              <Input
                id="shift-workers"
                type="number"
                min="1"
                value={shiftTypeWorkers}
                onChange={(e) => setShiftTypeWorkers(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-start">Start time</Label>
              <Input
                id="shift-start"
                type="time"
                value={shiftTypeStart}
                onChange={(e) => setShiftTypeStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift-end">End time</Label>
              <Input
                id="shift-end"
                type="time"
                value={shiftTypeEnd}
                onChange={(e) => setShiftTypeEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[140px_1fr]">
            <div className="space-y-2">
              <Label htmlFor="shift-color">Shift color</Label>
              <Input
                id="shift-color"
                type="color"
                value={shiftTypeColor}
                onChange={(e) => setShiftTypeColor(e.target.value)}
                className="h-11 w-16 rounded border"
              />
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <Button onClick={() => void saveShiftType()}>
                {editingShiftTypeId ? "Update Template" : "Add Template"}
              </Button>
              {editingShiftTypeId ? (
                <Button type="button" variant="outline" onClick={resetShiftTypeForm}>
                  Cancel Edit
                </Button>
              ) : null}
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {shiftTypes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No shift templates yet.
              </div>
            ) : (
              shiftTypes.map((shiftType) => (
                <div
                  key={shiftType.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: shiftType.color || "#2563EB" }}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{shiftType.name}</p>
                      <p className="text-sm text-slate-600">
                        {shiftType.start_time} - {shiftType.end_time} · {shiftType.required_workers} worker(s)
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" onClick={() => editShiftType(shiftType)}>
                      Edit
                    </Button>
                    <Button type="button" variant="outline" onClick={() => void toggleShiftTypeActive(shiftType)}>
                      {shiftType.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="Team invite tools" description="This generator now uses a database-backed join code so it stays after page changes and reloads.">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join Code</p>
              <p className="mt-2 text-2xl font-semibold tracking-[0.2em] text-slate-900">
                {joinCodeLoading ? "Loading..." : joinCode || "------"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => void copyJoinCode()} disabled={!joinCode}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Join Code
                </Button>
                <Button onClick={() => void regenerateJoinCode()} disabled={joinCodeBusy}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  {joinCodeBusy ? "Saving..." : joinCode ? "Regenerate Join Code" : "Generate Join Code"}
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Join Link</p>
              <p className="mt-2 break-all text-sm text-slate-700">
                {joinLink || "Generate a join code to create a shareable link."}
              </p>

              <div className="mt-4">
                <Button variant="outline" onClick={() => void copyJoinLink()} disabled={!joinLink}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Join Link
                </Button>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  )
}
