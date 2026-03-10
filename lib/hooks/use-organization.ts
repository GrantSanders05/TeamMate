
"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"

const OrgContext = createContext(undefined)

export function OrgProvider({ children, userId }) {
  const supabase = createClient()

  const [organization, setOrganization] = useState(null)
  const [member, setMember] = useState(null)
  const [memberships, setMemberships] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  async function load() {
    setIsLoading(true)

    const { data: memberRows } = await supabase
      .from("organization_members")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (!memberRows || memberRows.length === 0) {
      setOrganization(null)
      setMember(null)
      setMemberships([])
      setIsLoading(false)
      return
    }

    const orgIds = memberRows.map(m => m.organization_id)

    const { data: orgs } = await supabase
      .from("organizations")
      .select("*")
      .in("id", orgIds)

    const mapped = memberRows.map(row => ({
      org: orgs.find(o => o.id === row.organization_id),
      member: row
    }))

    setMemberships(mapped)

    const selected = mapped[0]

    setOrganization(selected.org)
    setMember(selected.member)

    setIsLoading(false)
  }

  useEffect(() => {
    load()
  }, [userId])

  const value = useMemo(() => ({
    organization,
    member,
    memberships,
    isLoading,
    refresh: load
  }), [organization, member, memberships, isLoading])

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error("useOrg must be used inside OrgProvider")
  return ctx
}
