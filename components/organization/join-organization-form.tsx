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

  async function handleJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
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
        .select("*")
        .eq("join_code", normalizedCode)
        .single(),
      supabase.from("profiles").select("*").eq("id", user.id).single(),
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
      .select("*")
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
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Join organization</h2>
      <p className="mt-1 text-sm text-slate-500">
        Enter the 6-character code shared by your manager.
      </p>

      <form className="mt-4 space-y-4" onSubmit={handleJoin}>
        <div>
          <Label htmlFor="joinCode">Join code</Label>
          <Input
            id="joinCode"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="ABC123"
            maxLength={6}
            required
          />
        </div>

        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? "Joining..." : "Join Organization"}
        </Button>
      </form>
    </div>
  )
}
