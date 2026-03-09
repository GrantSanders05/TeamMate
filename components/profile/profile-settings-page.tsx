"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"
import { OrgBrandHeader } from "@/components/organization/org-brand-header"

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
      .select("id, organization_id, display_name, role, is_active, joined_at, organizations(id, name, join_code)")
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

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(payload)

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
    return <div className="rounded-lg border bg-white p-6">Loading profile...</div>
  }

  return (
    <div className="space-y-6">
      <OrgBrandHeader
        title={organization ? `${organization.name} Profile` : "Profile"}
        subtitle="Manage your account details, password, and organization presence."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Account Details</h2>

            <div>
              <Label htmlFor="profileEmail">Email</Label>
              <Input id="profileEmail" value={email} disabled />
            </div>

            <div>
              <Label htmlFor="profileName">Full name</Label>
              <Input
                id="profileName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div>
              <Label htmlFor="profileAvatar">Avatar / photo URL</Label>
              <Input
                id="profileAvatar"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="profileBio">Short bio</Label>
              <Textarea
                id="profileBio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short note about you"
              />
            </div>

            <Button onClick={() => void saveProfile()} disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save Profile"}
            </Button>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">Change Password</h2>

            <div>
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>

            <Button variant="outline" onClick={() => void updatePassword()} disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Current Organization</h2>

            {organization ? (
              <div className="mt-4 rounded-xl border bg-slate-50 p-4">
                <div className="font-medium text-slate-900">{organization.name}</div>
                <div className="mt-1 text-sm text-slate-600">
                  Join code: {organization.join_code}
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-500">No organization selected.</div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">My Organizations</h2>

            {memberships.length === 0 ? (
              <div className="mt-4 text-sm text-slate-500">You are not in any organizations yet.</div>
            ) : (
              <div className="mt-4 space-y-3">
                {memberships.map((membership) => (
                  <div key={membership.id} className="rounded-xl border p-4">
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
          </div>
        </aside>
      </div>
    </div>
  )
}
