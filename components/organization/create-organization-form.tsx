"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in and try again.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const [{ data: profile }, slug, joinCode] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      generateUniqueSlug(name),
      generateUniqueJoinCode(),
    ])

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
        created_by: user.id,
      })
      .select()
      .single()

    if (orgError || !organization) {
      toast({
        title: "Could not create organization",
        description: orgError?.message || "Unknown error",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: organization.id,
      user_id: user.id,
      role: "manager",
      display_name: profile?.full_name || user.email || "Manager",
      is_active: true,
    })

    if (memberError) {
      toast({
        title: "Organization created, but membership failed",
        description: memberError.message,
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    await refresh()

    toast({
      title: "Organization created",
      description: `${organization.name} is ready to use.`,
    })

    router.push("/dashboard")
    router.refresh()
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

        <div className="rounded-xl p-4 text-white shadow-sm" style={previewStyle}>
          <div className="text-xs uppercase tracking-[0.16em] text-white/80">Brand preview</div>
          <div className="mt-2 text-xl font-semibold">{name || "Your organization"}</div>
          <div className="mt-1 text-sm text-white/80">
            {fontFamily} · {timezone}
          </div>
        </div>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Organization"}
        </Button>
      </form>
    </div>
  )
}
