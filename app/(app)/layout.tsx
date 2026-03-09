import { redirect } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/login")
  }

  return (
    <AppShell
      userId={session.user.id}
      userEmail={session.user.email ?? ""}
    >
      {children}
    </AppShell>
  )
}
