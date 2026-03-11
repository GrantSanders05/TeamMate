"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Building2, Copy, Link2, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OrganizationThemePresets } from "@/components/settings/organization-theme-presets"
import { useToast } from "@/components/ui/use-toast"
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_TIMEZONE,
  FONT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/constants"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { generateUniqueJoinCode } from "@/lib/organization/join-code"
import { createClient } from "@/lib/supabase/client"

export function OrgSettingsForm() {
  const supabase = createClient()
  const { organization, refresh, isManager, isLoading } = useOrgSafe()
  const { toast } = useToast()

  const [name, setName] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR)
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR)
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT_FAMILY)
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [joinCode, setJoinCode] = useState("")
  const [saving, setSaving] = useState(false)
  const [joinCodeBusy, setJoinCodeBusy] = useState(false)
  const bootstrappedRef = useRef(false)

  useEffect(() => {
    if (!organization) return

    setName(organization.name || "")
    setLogoUrl(organization.logo_url || "")
    setPrimaryColor(organization.primary_color || DEFAULT_PRIMARY_COLOR)
    setSecondaryColor(organization.secondary_color || DEFAULT_SECONDARY_COLOR)
    setFontFamily(organization.font_family || DEFAULT_FONT_FAMILY)
    setTimezone(organization.timezone || DEFAULT_TIMEZONE)
    setJoinCode((organization.join_code || "").trim().toUpperCase())
    bootstrappedRef.current = false
  }, [
    organization?.id,
    organization?.name,
    organization?.logo_url,
    organization?.primary_color,
    organization?.secondary_color,
    organization?.font_family,
    organization?.timezone,
    organization?.join_code,
  ])

  const joinLink = useMemo(() => {
    if (!joinCode || typeof window === "undefined") return ""
    return `${window.location.origin}/join/${joinCode}`
  }, [joinCode])

  const previewStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor} 100%)`,
      fontFamily,
    }),
    [primaryColor, secondaryColor, fontFamily]
  )

  async function saveSettings() {
    if (!organization) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: name.trim(),
          logo_url: logoUrl.trim() || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font_family: fontFamily,
          timezone: timezone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organization.id)

      if (error) throw new Error(error.message)

      await refresh()
      toast({
        title: "Organization settings saved",
        description: `${name.trim() || organization.name} has been updated.`,
      })
    } catch (error) {
      toast({
        title: "Could not save settings",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function persistJoinCode(mode: "generate" | "regenerate") {
    if (!organization) return

    setJoinCodeBusy(true)
    try {
      const nextCode = await generateUniqueJoinCode(supabase, organization.id)

      const { data, error } = await supabase
        .from("organizations")
        .update({
          join_code: nextCode,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organization.id)
        .select("join_code")
        .single()

      if (error) throw new Error(error.message)

      const persistedCode = String(data?.join_code || nextCode).trim().toUpperCase()
      setJoinCode(persistedCode)
      await refresh()

      toast({
        title: mode === "generate" ? "Join code created" : "Join code regenerated",
        description:
          mode === "generate"
            ? `${persistedCode} is now active for ${organization.name}.`
            : `${persistedCode} replaced the old join code for ${organization.name}.`,
      })
    } catch (error) {
      toast({
        title: "Could not update join code",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setJoinCodeBusy(false)
    }
  }

  async function copyText(value: string, successTitle: string, successDescription: string) {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      toast({ title: successTitle, description: successDescription })
    } catch {
      toast({
        title: "Could not copy",
        description: "Please copy it manually.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (!organization?.id || joinCode || bootstrappedRef.current) return

    bootstrappedRef.current = true
    void persistJoinCode("generate")
  }, [organization?.id, joinCode])

  if (isLoading) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Loading settings…</div>
  }

  if (!organization) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Select an organization to continue.</div>
  }

  if (!isManager) {
    return <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Only managers can edit organization settings.</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2.5">
                <Building2 className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">Organization Settings</h1>
                <p className="text-sm text-slate-500">
                  Manage branding, workspace details, and your stable join code.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copyText(joinCode, "Join code copied", "The join code is ready to share.")} disabled={!joinCode}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Join Code
            </Button>
            <Button type="button" variant="outline" onClick={() => void copyText(joinLink, "Join link copied", "Employees can now use the copied link to join your organization.")} disabled={!joinLink}>
              <Link2 className="mr-2 h-4 w-4" />
              Copy Join Link
            </Button>
            <Button type="button" onClick={() => void persistJoinCode(joinCode ? "regenerate" : "generate")} disabled={joinCodeBusy}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {joinCodeBusy ? (joinCode ? "Regenerating..." : "Generating...") : joinCode ? "Regenerate Join Code" : "Generate Join Code"}
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Workspace Details</h2>
              <p className="text-sm text-slate-500">Update the organization name, logo, colors, and font.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-name">Organization name</Label>
                <Input id="org-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Acme Coffee" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-logo-url">Logo URL</Label>
                <Input id="org-logo-url" value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} placeholder="https://example.com/logo.png" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary brand color</Label>
                <div className="flex items-center gap-3">
                  <Input id="primary-color-picker" type="color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} className="h-11 w-16 rounded-xl p-1" />
                  <Input id="primary-color" value={primaryColor} onChange={(event) => setPrimaryColor(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary-color">Accent / dark color</Label>
                <div className="flex items-center gap-3">
                  <Input id="secondary-color-picker" type="color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} className="h-11 w-16 rounded-xl p-1" />
                  <Input id="secondary-color" value={secondaryColor} onChange={(event) => setSecondaryColor(event.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-family">Font family</Label>
                <select
                  id="font-family"
                  value={fontFamily}
                  onChange={(event) => setFontFamily(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                >
                  {FONT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-slate-400"
                >
                  {TIMEZONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6">
              <OrganizationThemePresets
                onApply={(primary, secondary) => {
                  setPrimaryColor(primary)
                  setSecondaryColor(secondary)
                }}
              />
            </div>

            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => void saveSettings()} disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Join Code</h2>
              <p className="text-sm text-slate-500">This code stays the same until you explicitly regenerate it.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current code</div>
              <div className="mt-2 text-3xl font-semibold tracking-[0.3em] text-slate-900">{joinCode || "------"}</div>
              <p className="mt-2 text-xs text-slate-500">Stable on refresh. Changes only when you regenerate it.</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Join link</div>
              <div className="mt-2 break-all text-sm text-slate-700">{joinLink || "A join link will appear here after the code is generated."}</div>
              <p className="mt-2 text-xs text-slate-500">Regenerating the code invalidates the old link and activates the new one.</p>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="p-6" style={previewStyle}>
              <div className="flex items-center gap-3 text-white">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="Organization logo" className="h-12 w-12 rounded-xl border border-white/20 bg-white/10 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-lg font-semibold">
                    {(name || organization.name || "O").charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="text-xs uppercase tracking-[0.25em] text-white/70">Workspace</div>
                  <div className="text-xl font-semibold">{name || organization.name}</div>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Primary</div>
                <div className="mt-1 text-sm text-slate-700">{primaryColor}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accent</div>
                <div className="mt-1 text-sm text-slate-700">{secondaryColor}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Font</div>
                <div className="mt-1 text-sm text-slate-700">{fontFamily}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timezone</div>
                <div className="mt-1 text-sm text-slate-700">{timezone}</div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default OrgSettingsForm
