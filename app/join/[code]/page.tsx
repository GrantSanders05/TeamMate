import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { JoinByLinkClient } from "@/components/organization/join-by-link-client"

export const dynamic = "force-dynamic"

export default async function JoinPage({
  params,
}: {
  params: { code: string }
}) {
  const supabase = createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect(`/login?redirect=${encodeURIComponent(`/join/${params.code}`)}`)
  }

  return <JoinByLinkClient code={params.code.toUpperCase()} />
}
