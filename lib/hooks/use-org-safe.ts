"use client"

import { useOrg } from "@/lib/hooks/use-organization"

export function useOrgSafe() {
  try {
    const ctx = useOrg()
    return {
      organization: ctx?.organization ?? null,
      member: ctx?.member ?? null,
      memberships: ctx?.memberships ?? [],
      isManager: ctx?.isManager ?? false,
      isLoading: ctx?.isLoading ?? false,
      refresh: ctx?.refresh ?? (async () => {}),
      setActiveOrg: ctx?.setActiveOrg ?? (() => {}),
    }
  } catch {
    return {
      organization: null,
      member: null,
      memberships: [],
      isManager: false,
      isLoading: true,
      refresh: async () => {},
      setActiveOrg: () => {},
    }
  }
}
