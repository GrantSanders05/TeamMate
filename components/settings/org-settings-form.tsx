
"use client"

import { useOrg } from "@/lib/hooks/use-organization"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export function OrgSettingsForm() {
  const supabase = createClient()
  const { organization, refresh } = useOrg()

  const [loading, setLoading] = useState(false)

  const joinCode = organization?.join_code || ""

  async function generateCode() {
    if (!organization) return

    setLoading(true)

    const code = Math.random().toString(36).substring(2,8).toUpperCase()

    const { error } = await supabase
      .from("organizations")
      .update({ join_code: code })
      .eq("id", organization.id)

    if (!error) {
      await refresh()
      alert("Join code created")
    }

    setLoading(false)
  }

  return (
    <div>
      <h3>Join Code</h3>
      <p>{joinCode || "------"}</p>

      <button onClick={generateCode} disabled={loading}>
        {loading ? "Generating..." : "Generate Join Code"}
      </button>
    </div>
  )
}
