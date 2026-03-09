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
import { ACTIVE_ORG_STORAGE_KEY } from "@/lib/constants"
import { createClient } from "@/lib/supabase/client"
import type {
  OrgContextValue,
  Organization,
  OrganizationMember,
  OrganizationMembership,
  UserRole,
} from "@/lib/types"

const OrgContext = createContext<OrgContextValue | undefined>(undefined)

interface MembershipQueryRow extends OrganizationMember {
  organizations: Organization | null
}

export function OrgProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId: string
}) {
  const supabase = createClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [member, setMember] = useState<OrganizationMember | null>(null)
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const setActiveOrg = useCallback(
    (organizationId: string) => {
      const next = memberships.find((item) => item.org.id === organizationId)
      if (!next) return

      setOrganization(next.org)
      setMember(next.member)

      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, organizationId)
      }
    },
    [memberships]
  )

  const refresh = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("organization_members")
      .select("*, organizations(*)")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("joined_at", { ascending: true })

    if (error) {
      console.error("Failed to load organization memberships", error)
      setMemberships([])
      setOrganization(null)
      setMember(null)
      setIsLoading(false)
      return
    }

    const mapped: OrganizationMembership[] = ((data ?? []) as MembershipQueryRow[])
      .filter((row) => Boolean(row.organizations))
      .map((row) => ({
        org: row.organizations as Organization,
        member: {
          id: row.id,
          organization_id: row.organization_id,
          user_id: row.user_id,
          role: row.role,
          display_name: row.display_name,
          is_active: row.is_active,
          joined_at: row.joined_at,
        },
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
        ? localStorage.getItem(ACTIVE_ORG_STORAGE_KEY)
        : null

    const selected = mapped.find((item) => item.org.id === savedOrgId) ?? mapped[0]

    setOrganization(selected.org)
    setMember(selected.member)

    if (typeof window !== "undefined") {
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, selected.org.id)
    }

    setIsLoading(false)
  }, [supabase, userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const role = (member?.role as UserRole | null) ?? null
  const isManager = role === "manager"

  const value = useMemo<OrgContextValue>(
    () => ({
      organization,
      member,
      memberships,
      role,
      isManager,
      isLoading,
      refresh,
      setActiveOrg,
    }),
    [organization, member, memberships, role, isManager, isLoading, refresh, setActiveOrg]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  const context = useContext(OrgContext)

  if (!context) {
    throw new Error("useOrg must be used inside an OrgProvider")
  }

  return context
}
