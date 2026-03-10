"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"

type OrgRecord = {
  id: string
  name?: string
  logo_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
}

type MemberRecord = {
  id: string
  organization_id: string
  user_id: string
  role: string
  display_name?: string | null
  is_active?: boolean
}

type OrgPair = { org: OrgRecord; member: MemberRecord }

type OrgContextType = {
  organization: OrgRecord | null
  member: MemberRecord | null
  role: string | null
  isManager: boolean
  isLoading: boolean
  memberships: OrgPair[]
  allOrgs: OrgPair[]
  refresh: () => Promise<void>
  setActiveOrg: (orgId: string) => void
}

const OrgContext = createContext<OrgContextType | null>(null)

export function OrgProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [organization, setOrganization] = useState<OrgRecord | null>(null)
  const [member, setMember] = useState<MemberRecord | null>(null)
  const [memberships, setMemberships] = useState<OrgPair[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadOrgs = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("organization_members")
      .select("id, organization_id, user_id, role, display_name, is_active, organizations(id, name, logo_url, primary_color, secondary_color)")
      .eq("user_id", userId)
      .eq("is_active", true)

    if (error || !data) {
      setMemberships([])
      setOrganization(null)
      setMember(null)
      setIsLoading(false)
      return
    }

    const mapped = (data as Array<any>)
      .filter((row) => row.organizations)
      .map((row) => ({
        org: row.organizations as OrgRecord,
        member: {
          id: row.id,
          organization_id: row.organization_id,
          user_id: row.user_id,
          role: row.role,
          display_name: row.display_name,
          is_active: row.is_active,
        } as MemberRecord,
      }))

    setMemberships(mapped)

    if (mapped.length === 0) {
      setOrganization(null)
      setMember(null)
      setIsLoading(false)
      return
    }

    const savedOrgId =
      typeof window !== "undefined"
        ? window.localStorage.getItem("teammate_active_org")
        : null

    const active = mapped.find((item) => item.org.id === savedOrgId) ?? mapped[0]
    setOrganization(active.org)
    setMember(active.member)
    setIsLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    void loadOrgs()
  }, [loadOrgs])

  const setActiveOrg = useCallback(
    (orgId: string) => {
      const found = memberships.find((item) => item.org.id === orgId)
      if (!found) return
      setOrganization(found.org)
      setMember(found.member)
      if (typeof window !== "undefined") {
        window.localStorage.setItem("teammate_active_org", orgId)
      }
    },
    [memberships]
  )

  const value: OrgContextType = {
    organization,
    member,
    role: member?.role ?? null,
    isManager: member?.role === "manager",
    isLoading,
    memberships,
    allOrgs: memberships,
    refresh: loadOrgs,
    setActiveOrg,
  }

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const value = useContext(OrgContext)
  if (!value) {
    throw new Error("useOrg must be used inside OrgProvider")
  }
  return value
}
