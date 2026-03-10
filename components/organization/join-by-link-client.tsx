"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

export function JoinByLinkClient({ code }: { code: string }) {
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()
  const [message, setMessage] = useState("Joining organization...")

  useEffect(() => {
    let mounted = true

    async function handleJoin() {
      const normalizedCode = code.trim().toUpperCase()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(`/join/${normalizedCode}`)}`)
        return
      }

      const [{ data: organization }, { data: profile }] = await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, join_code")
          .ilike("join_code", normalizedCode)
          .maybeSingle(),
        supabase.from("profiles").select("id, full_name, email").eq("id", user.id).single(),
      ])

      if (!organization) {
        if (mounted) {
          setMessage("That join link is invalid or expired.")
        }
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
          if (mounted) setMessage(error.message)
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
          if (mounted) setMessage(error.message)
          return
        }
      }

      toast({
        title: "Joined organization",
        description: `You joined ${organization.name}.`,
      })
      router.push("/dashboard")
      router.refresh()
    }

    void handleJoin()

    return () => {
      mounted = false
    }
  }, [code, router, supabase, toast])

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center px-4">
      <div className="section-card w-full text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">TeamMate</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Joining organization</h1>
        <p className="mt-3 text-sm text-slate-600">{message}</p>
      </div>
    </div>
  )
}
