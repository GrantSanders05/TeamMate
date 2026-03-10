"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"
import { PageShell } from "@/components/shared/page-shell"
import { SectionCard } from "@/components/shared/section-card"

type MembershipRow = {
  id: string
  organization_id: string
  display_name: string
  role: string
  is_active: boolean
  joined_at: string
  organizations: {
    id: string
    name: string
    join_code: string
  } | null
}

type ProfileRow = {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

function FieldShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm">
      {children}
    </div>
  )
}

export function ProfileSettingsPage() {
  const supabase = createClient()
  const { organization, refresh } = useOrgSafe()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [userId, setUserId] = useState("")
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [bio, setBio] = useState("")
  const [memberships, setMemberships] = useState<MembershipRow[]>([])

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  async function loadProfile() {
    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setLoading(false)
      return
    }

    setUserId(user.id)
    setEmail(user.email || "")

    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()

    const profile = profileData as ProfileRow | null

    setFullName(profile?.full_name || user.user_metadata?.full_name || "")
    setAvatarUrl(profile?.avatar_url || "")
    setBio(user.user_metadata?.bio || "")

    const { data: membershipData } = await supabase
      .from("organization_members")
      .select(
        "id, organization_id, display_name, role, is_active, joined_at, organizations(id, name, join_code)"
      )
      .eq("user_id", user.id)
      .order("joined_at", { ascending: true })

    setMemberships((membershipData as MembershipRow[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  async function saveProfile() {
    if (!userId || !fullName.trim()) {
      alert("Please enter your full name.")
      return
    }

    setSavingProfile(true)

    const payload = {
      id: userId,
      email,
      full_name: fullName.trim(),
      avatar_url: avatarUrl.trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from("profiles").upsert(payload)

    if (profileError) {
      setSavingProfile(false)
      alert(profileError.message)
      return
    }

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        full_name: fullName.trim(),
        avatar_url: avatarUrl.trim() || null,
        bio: bio.trim() || null,
      },
    })

    if (authError) {
      setSavingProfile(false)
      alert(authError.message)
      return
    }

    const { error: memberError } = await supabase
      .from("organization_members")
      .update({ display_name: fullName.trim() })
      .eq("user_id", userId)

    if (memberError) {
      setSavingProfile(false)
      alert(memberError.message)
      return
    }

    await refresh()
    await loadProfile()

    setSavingProfile(false)
    alert("Profile saved.")
  }

  async function updatePassword() {
    if (!newPassword || !confirmPassword) {
      alert("Please fill out both password fields.")
      return
    }

    if (newPassword.length < 6) {
      alert("Password should be at least 6 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    setSavingPassword(true)

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setSavingPassword(false)

    if (error) {
      alert(error.message)
      return
    }

    setNewPassword("")
    setConfirmPassword("")
    alert("Password updated.")
  }

  if (loading) {
    return <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">Loading profile...</div>
  }

  return (
    <PageShell>
      <OrgBrandHeader
        title={organization ? `${organization.name} Profile` : "Profile"}
        subtitle="Manage your account details, password, and organization presence."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <SectionCard title="Account Details" className="rounded-[30px] p-6">
            <div className="space-y-4">
              <FieldShell>
                <Label htmlFor="profileEmail" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Email
                </Label>
                <Input id="profileEmail" value={email} disabled className="mt-3 rounded-2xl border-white bg-white" />
              </FieldShell>

              <FieldShell>
                <Label htmlFor="profileName" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Full name
                </Label>
                <Input
                  id="profileName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="mt-3 rounded-2xl border-white bg-white"
                />
              </FieldShell>

              <FieldShell>
                <Label htmlFor="profileAvatar" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Avatar / photo URL
                </Label>
                <Input
                  id="profileAvatar"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-3 rounded-2xl border-white bg-white"
                />
              </FieldShell>

              <FieldShell>
                <Label htmlFor="profileBio" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Short bio
                </Label>
                <Textarea
                  id="profileBio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short note about you"
                  className="mt-3 min-h-[120px] rounded-2xl border-white bg-white"
                />
              </FieldShell>

              <Button onClick={() => void saveProfile()} disabled={savingProfile} className="rounded-2xl px-5">
                {savingProfile ? "Saving..." : "Save Profile"}
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Change Password" className="rounded-[30px] p-6">
            <div className="space-y-4">
              <FieldShell>
                <Label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  New password
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  className="mt-3 rounded-2xl border-white bg-white"
                />
              </FieldShell>

              <FieldShell>
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Confirm new password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="mt-3 rounded-2xl border-white bg-white"
                />
              </FieldShell>

              <Button
                variant="outline"
                onClick={() => void updatePassword()}
                disabled={savingPassword}
                className="rounded-2xl px-5"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard title="Current Organization" className="rounded-[30px] p-6">
            {organization ? (
              <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="font-medium text-slate-900">{organization.name}</div>
                <div className="mt-1 text-sm text-slate-600">Join code: {organization.join_code}</div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">No organization selected.</div>
            )}
          </SectionCard>

          <SectionCard title="My Organizations" className="rounded-[30px] p-6">
            {memberships.length === 0 ? (
              <div className="text-sm text-slate-500">You are not in any organizations yet.</div>
            ) : (
              <div className="space-y-3">
                {memberships.map((membership) => (
                  <div
                    key={membership.id}
                    className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          {membership.organizations?.name || "Organization"}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          Display name: {membership.display_name}
                        </div>
                      </div>
                      <div
                        className={
                          membership.role === "manager"
                            ? "rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700"
                            : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                        }
                      >
                        {membership.role}
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">
                      Status: {membership.is_active ? "Active" : "Inactive"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </aside>
      </div>
    </PageShell>
  )
}
