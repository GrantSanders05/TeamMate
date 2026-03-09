'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Organization, OrganizationMember, UserRole } from '@/lib/types'

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

export function OrgProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [member, setMember] = useState<OrganizationMember | null>(null)
  const [allOrgs, setAllOrgs] = useState<{ org: Organization; member: OrganizationMember }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadOrgs()
  }, [userId])

  async function loadOrgs() {
    setIsLoading(true)
    
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (!memberships || memberships.length === 0) {
      setIsLoading(false)
      return
    }

    const orgs = memberships.map(m => ({
      org: m.organizations as Organization,
      member: m as OrganizationMember,
    }))
    
    setAllOrgs(orgs)

    // Try to restore last active org from localStorage
    const savedOrgId = typeof window !== 'undefined' ? localStorage.getItem('teammate_active_org') : null
    const savedOrg = savedOrgId ? orgs.find(o => o.org.id === savedOrgId) : null
    
    const activeOrg = savedOrg || orgs[0]
    setOrganization(activeOrg.org)
    setMember(activeOrg.member)
    
    setIsLoading(false)
  }

  function setActiveOrg(orgId: string) {
    const found = allOrgs.find(o => o.org.id === orgId)
    if (found) {
      setOrganization(found.org)
      setMember(found.member)
      if (typeof window !== 'undefined') {
        localStorage.setItem('teammate_active_org', orgId)
      }
    }
  }

  const role = member?.role as UserRole | null
  const isManager = role === 'manager'

  return (
    <OrgContext.Provider value={{ organization, member, role, isManager, isLoading, setActiveOrg, allOrgs }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  return useContext(OrgContext)
}
