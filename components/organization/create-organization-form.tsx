"use client"

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Link2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useOrg } from "@/lib/hooks/use-organization"
import { generateUniqueJoinCode } from "@/lib/organization/join-code"
import {
  DEFAULT_FONT_FAMILY,
  DEFAULT_PRIMARY_COLOR,
  DEFAULT_SECONDARY_COLOR,
  DEFAULT_TIMEZONE,
  FONT_OPTIONS,
  TIMEZONE_OPTIONS,
} from "@/lib/constants"

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}

export function CreateOrganizationForm() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const { refresh } = useOrg()

  const [name, setName] = useState("")
  const [primaryColor, setPrimaryColor] = useState(DEFAULT_PRIMARY_COLOR)
  const [secondaryColor, setSecondaryColor] = useState(DEFAULT_SECONDARY_COLOR)
  const [fontFamily, setFontFamily] = useState(DEFAULT_FONT_FAMILY)
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [logoUrl, setLogoUrl] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const previewStyle = useMemo(
    () => ({
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
      fontFamily,
    }),
    [primaryColor, secondaryColor, fontFamily]
  )

  async function generateUniqueSlug(baseName: string) {
    const baseSlug = slugify(baseName)
    let candidate = baseSlug
    let index = 1

    while (true) {
      const { data, error } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle()

      if (error && error.code !== "PGRST116") {
        throw new Error(error.message)
      }

      if (!data) return candidate

      index += 1
      candidate = `${baseSlug}-${index}`
    }
  }

  async function uploadLogo(userId: string) {
    if (!logoFile) {
      return logoUrl.trim() || null
    }

    const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png"
    const filePath = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from("org-logos").upload(filePath, logoFile, {
      cacheControl: "3600",
      upsert: false,
    })

    if (error) {
      throw new Error(error.message)
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("org-logos").getPublicUrl(filePath)

    return publicUrl
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(userError?.message || "Please log in and try again.")
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      const slug = await generateUniqueSlug(name)
      const joinCode = await generateUniqueJoinCode(supabase)
      const uploadedLogoUrl = await uploadLogo(user.id)

      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name,
          slug,
          join_code: joinCode,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          font_family: fontFamily,
          timezone,
          logo_url: uploadedLogoUrl,
          created_by: user.id,
        })
        .select()
        .single()

      if (orgError || !organization) {
        throw new Error(orgError?.message || "Could not create organization.")
      }

      const { error: memberError } = await supabase.from("organization_members").insert({
        organization_id: organization.id,
        user_id: user.id,
        role: "manager",
        display_name: profile.full_name || user.email || "Manager",
        is_active: true,
      })

      if (memberError) {
        throw new Error(memberError.message)
      }

      await refresh()

      toast({
        title: "Organization created",
        description: `${organization.name} is ready to use. Join code ${joinCode} was saved.`,
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      toast({
        title: "Could not create organization",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    setLogoFile(event.target.files?.[0] ?? null)
  }

  return (
    <form onSubmit={handleCreate} className="space-y-6">
      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Create organization</h2>
          <p className="text-sm text-slate-500">
            Start a new workspace for your team with custom branding.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Acme Coffee"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-primary-color">Primary color</Label>
            <Input
              id="org-primary-color"
              type="color"
              value={primaryColor}
              onChange={(event) => setPrimaryColor(event.target.value)}
              className="h-11 w-20 rounded-xl p-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-secondary-color">Secondary color</Label>
            <Input
              id="org-secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(event) => setSecondaryColor(event.target.value)}
              className="h-11 w-20 rounded-xl p-1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-font">Font</Label>
            <select
              id="org-font"
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
            <Label htmlFor="org-timezone">Timezone</Label>
            <select
              id="org-timezone"
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
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <ImagePlus className="h-4 w-4 text-slate-500" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Logo</h3>
            <p className="text-sm text-slate-500">Upload a logo or paste a public image URL.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="org-logo-upload">Upload logo</Label>
            <Input id="org-logo-upload" type="file" accept="image/*" onChange={handleLogoUpload} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-logo-url">Or paste an image URL</Label>
            <Input
              id="org-logo-url"
              value={logoUrl}
              onChange={(event) => setLogoUrl(event.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        {logoUrl || logoFile ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {logoUrl ? "Logo URL ready" : "Logo file ready"}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-slate-500" />
          <div>
            <h3 className="text-base font-semibold text-slate-900">Brand preview</h3>
            <p className="text-sm text-slate-500">
              A stable join code is created once and stored with the organization.
            </p>
          </div>
        </div>

        <div style={previewStyle} className="rounded-2xl p-6 text-white shadow-sm">
          <div className="text-xl font-semibold">{name || "Your organization"}</div>
          <div className="mt-2 text-sm text-white/85">
            {fontFamily} · {timezone}
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </div>
    </form>
  )
}
