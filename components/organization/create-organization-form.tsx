"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { ImagePlus, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useOrg } from "@/lib/hooks/use-organization"
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

function createJoinCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }

  return code
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
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("slug", candidate)
        .maybeSingle()

      if (!data) return candidate

      index += 1
      candidate = `${baseSlug}-${index}`
    }
  }

  async function generateUniqueJoinCode() {
    while (true) {
      const candidate = createJoinCode()
      const { data } = await supabase
        .from("organizations")
        .select("id")
        .eq("join_code", candidate)
        .maybeSingle()

      if (!data) return candidate
    }
  }

  async function uploadLogo(userId: string) {
    if (!logoFile) {
      return logoUrl.trim() || null
    }

    const ext = logoFile.name.split(".").pop()?.toLowerCase() || "png"
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`

    const { error } = await supabase.storage
      .from("org-logos")
      .upload(filePath, logoFile, {
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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error(userError?.message || "Please log in and try again.")
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profileError) {
        throw new Error(profileError.message)
      }

      const slug = await generateUniqueSlug(name)
      const joinCode = await generateUniqueJoinCode()
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

      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
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
        description: `${organization.name} is ready to use.`,
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

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Create organization</h2>
      <p className="mt-1 text-sm text-slate-500">
        Start a new workspace for your team with custom branding.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleCreate}>
        <div>
          <Label htmlFor="orgName">Organization name</Label>
          <Input
            id="orgName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Acme Coffee"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="primaryColor">Primary color</Label>
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="secondaryColor">Secondary color</Label>
            <Input
              id="secondaryColor"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label htmlFor="fontFamily">Font</Label>
          <select
            id="fontFamily"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <select
            id="timezone"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
          >
            {TIMEZONE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4 rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <ImagePlus className="h-4 w-4" />
            Logo
          </div>

          <div>
            <Label htmlFor="logoFile">Upload logo</Label>
            <Input
              id="logoFile"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div>
            <Label htmlFor="logoUrl">
              <span className="inline-flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Or paste an image URL
              </span>
            </Label>
            <Input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </div>

        <div className="rounded-xl p-4 text-white shadow-sm" style={previewStyle}>
          <div className="flex items-center gap-3">
            {logoUrl || logoFile ? (
              <div className="h-12 w-12 overflow-hidden rounded-lg bg-white/20">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-white/80">
                    File ready
                  </div>
                )}
              </div>
            ) : null}

            <div>
              <div className="text-xs uppercase tracking-[0.16em] text-white/80">
                Brand preview
              </div>
              <div className="mt-1 text-xl font-semibold">
                {name || "Your organization"}
              </div>
              <div className="mt-1 text-sm text-white/80">
                {fontFamily} · {timezone}
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </form>
    </div>
  )
}
