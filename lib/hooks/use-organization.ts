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

type MembershipRow = OrganizationMember

function normalizeJoinCode(code: string | null | undefined) {
  return (code ?? "").trim().toUpperCase()
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

  const hydrateMemberships = useCallback(
    async (memberRows: MembershipRow[]) => {
      if (memberRows.length === 0) {
        setMemberships([])
        return []
      }

      const organizationIds = Array.from(
        new Set(memberRows.map((row) => row.organization_id).filter(Boolean))
      )

      const { data: orgRows, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .in("id", organizationIds)

      if (orgError) {
        throw orgError
      }

      const orgMap = new Map<string, Organization>()
      for (const org of (orgRows ?? []) as Organization[]) {
        orgMap.set(org.id, {
          ...org,
          join_code: normalizeJoinCode(org.join_code),
        })
      }

      const mapped: OrganizationMembership[] = memberRows
        .map((row) => {
          const org = orgMap.get(row.organization_id)
          if (!org) return null

          return {
            org,
            member: row,
          }
        })
        .filter(Boolean) as OrganizationMembership[]

      setMemberships(mapped)
      return mapped
    },
    [supabase]
  )

  const loadSelectedOrganization = useCallback(
    async (organizationId: string) => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId)
        .single()

      if (error) {
        throw error
      }

      const nextOrg = {
        ...(data as Organization),
        join_code: normalizeJoinCode((data as Organization).join_code),
      }

      setOrganization(nextOrg)
      return nextOrg
    },
    [supabase]
  )

  const setActiveOrg = useCallback(
    async (organizationId: string) => {
      const next = memberships.find((item) => item.org.id === organizationId)
      if (!next) return

      setMember(next.member)
      setOrganization(next.org)

      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, organizationId)
      }

      try {
        await loadSelectedOrganization(organizationId)
      } catch (error) {
        console.error("Failed to hydrate selected organization", error)
      }
    },
    [memberships, loadSelectedOrganization]
  )

  const refresh = useCallback(async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("organization_members")
      .select("id, organization_id, user_id, role, display_name, is_active, joined_at")
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

    const memberRows = ((data ?? []) as MembershipRow[]).filter(Boolean)

    if (memberRows.length === 0) {
      setMemberships([])
      setOrganization(null)
      setMember(null)
      setIsLoading(false)
      return
    }

    try {
      const mapped = await hydrateMemberships(memberRows)

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

      const currentOrgId = organization?.id ?? null
      const selectedMembership =
        mapped.find((item) => item.org.id === savedOrgId) ??
        mapped.find((item) => item.org.id === currentOrgId) ??
        mapped[0]

      setMember(selectedMembership.member)
      setOrganization(selectedMembership.org)

      if (typeof window !== "undefined") {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, selectedMembership.org.id)
      }

      await loadSelectedOrganization(selectedMembership.org.id)
    } catch (loadError) {
      console.error("Failed to load active organization", loadError)
      setOrganization(null)
      setMember(null)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId, organization?.id, hydrateMemberships, loadSelectedOrganization])

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
