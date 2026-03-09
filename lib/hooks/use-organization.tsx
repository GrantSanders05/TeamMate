'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Organization, OrganizationMember, UserRole } from '@/lib/types'

interface OrgContextType {
  organization: Organization | null
  member: OrganizationMember | null
  role: UserRole | null
  isManager: boolean
  isLoading: boolean
  setActiveOrg: (orgId: string) => void
  allOrgs: { org: Organization; member: OrganizationMember }[]
}

const OrgContext = createContext<OrgContextType>({
  organization: null,
  member: null,
  role: null,
  isManager: false,
  isLoading: true,
  setActiveOrg: () => {},
  allOrgs: [],
})

export function OrgProvider({
  children,
  userId,
}: {
  children: ReactNode
  userId: string
}) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [member, setMember] = useState<OrganizationMember | null>(null)
  const [allOrgs, setAllOrgs] = useState<{ org: Organization; member: OrganizationMember }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    let active = true

    async function loadOrgs() {
      setIsLoading(true)

      const { data: memberships } = await supabase
        .from('organization_members')
        .select('*, organizations(*)')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (!active) return

      if (!memberships || memberships.length === 0) {
        setAllOrgs([])
        setOrganization(null)
        setMember(null)
        setIsLoading(false)
        return
      }

      const mapped = memberships
        .map((m) => ({
          org: m.organizations as Organization | null,
          member: m as unknown as OrganizationMember,
        }))
        .filter((item): item is { org: Organization; member: OrganizationMember } => Boolean(item.org))

      setAllOrgs(mapped)

      const savedOrgId =
        typeof window !== 'undefined' ? localStorage.getItem('teammate_active_org') : null
      const savedOrg = savedOrgId ? mapped.find((o) => o.org.id === savedOrgId) : null
      const activeOrg = savedOrg ?? mapped[0] ?? null

      setOrganization(activeOrg?.org ?? null)
      setMember(activeOrg?.member ?? null)
      setIsLoading(false)
    }

    loadOrgs()

    return () => {
      active = false
    }
  }, [supabase, userId])

  function setActiveOrg(orgId: string) {
    const found = allOrgs.find((o) => o.org.id === orgId)
    if (!found) return

    setOrganization(found.org)
    setMember(found.member)

    if (typeof window !== 'undefined') {
      localStorage.setItem('teammate_active_org', orgId)
    }
  }

  const role = (member?.role as UserRole | null) ?? null
  const value = useMemo<OrgContextType>(
    () => ({
      organization,
      member,
      role,
      isManager: role === 'manager',
      isLoading,
      setActiveOrg,
      allOrgs,
    }),
    [organization, member, role, isLoading, allOrgs]
  )

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
}

export function useOrg() {
  return useContext(OrgContext)
}
