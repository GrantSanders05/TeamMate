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
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push(`/login?redirect=${encodeURIComponent(`/join/${code}`)}`)
        return
      }

      const [{ data: organization }, { data: profile }] = await Promise.all([
        supabase.from("organizations").select("*").eq("join_code", code).single(),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ])

      if (!organization) {
        if (mounted) {
          setMessage("That join link is invalid or expired.")
        }
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
          })
          .eq("id", existingMembership.id)

        if (error) {
          if (mounted) {
            setMessage(error.message)
          }
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
          if (mounted) {
            setMessage(error.message)
          }
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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="text-xl font-semibold">Teammate</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Joining organization</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
      </div>
    </main>
  )
}
