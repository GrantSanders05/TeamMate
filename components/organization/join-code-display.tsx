
"use client"

import { useOrg } from "@/lib/hooks/use-organization"

export function JoinCodeDisplay() {
  const { organization } = useOrg()

  const code = organization?.join_code || ""

  return (
    <div>
      <h3>Join Code</h3>
      <p>{code || "------"}</p>
    </div>
  )
}
