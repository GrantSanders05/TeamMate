"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { useOrg } from "@/lib/hooks/use-organization"

export function JoinOrganizationForm() {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const { refresh } = useOrg()
  const [joinCode, setJoinCode] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleJoin(event: React.FormEvent) {
    event.preventDefault()
    setLoading(true)

    const normalizedCode = joinCode.trim().toUpperCase()

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

    const [{ data: organization, error: orgError }, { data: profile }] = await Promise.all([
      supabase
        .from("organizations")
        .select("id, name, join_code")
        .ilike("join_code", normalizedCode)
        .maybeSingle(),
      supabase.from("profiles").select("id, full_name, email").eq("id", user.id).single(),
    ])

    if (orgError || !organization) {
      toast({
        title: "Invalid join code",
        description: "We couldn't find an organization with that code.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const { data: existingMembership } = await supabase
      .from("organization_members")
      .select("id, role, is_active")
      .eq("organization_id", organization.id)
      .eq("user_id", user.id)
      .maybeSingle()

    if (existingMembership?.is_active) {
      toast({
        title: "Already joined",
        description: `You're already a member of ${organization.name}.`,
      })
      await refresh()
      router.push("/dashboard")
      router.refresh()
      setLoading(false)
      return
    }

    if (existingMembership && !existingMembership.is_active) {
      const { error } = await supabase
        .from("organization_members")
        .update({
          is_active: true,
          display_name: profile?.full_name || user.email || "Employee",
          role: existingMembership.role || "employee",
        })
        .eq("id", existingMembership.id)

      if (error) {
        toast({
          title: "Could not rejoin organization",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }
    } else {
      const { error } = await supabase.from("organization_members").insert({
        organization_id: organization.id,
        user_id: user.id,
        role: "employee",
        display_name: profile?.full_name || user.email || "Employee",
        is_active: true,
      })

      if (error) {
        toast({
          title: "Could not join organization",
          description: error.message,
          variant: "destructive",
        })
        setLoading(false)
        return
      }
    }

    await refresh()
    toast({
      title: "Joined organization",
      description: `You joined ${organization.name}.`,
    })
    router.push("/dashboard")
    router.refresh()
    setLoading(false)
  }

  return (
    <form onSubmit={handleJoin} className="section-card max-w-xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Join organization</h2>
        <p className="mt-2 text-sm text-slate-600">Enter the 6-character code shared by your manager.</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="joinCode">Join code</Label>
        <Input
          id="joinCode"
          value={joinCode}
          onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          autoComplete="off"
          required
          className="h-12 rounded-2xl text-base tracking-[0.18em] uppercase"
        />
      </div>

      <Button type="submit" disabled={loading} className="rounded-2xl px-5">
        {loading ? "Joining..." : "Join Organization"}
      </Button>
    </form>
  )
}
