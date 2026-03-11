"use client"

import { Building2 } from "lucide-react"
import { useOrgSafe } from "@/lib/hooks/use-org-safe"

export function OrgBrandHeader() {
  const { organization } = useOrgSafe()
  if (!organization) return null

  return (
    <div className="brand-surface rounded-[28px] border border-slate-200 p-4 shadow-sm md:p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {organization.logo_url ? (
            <img src={organization.logo_url} alt={`${organization.name} logo`} className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-6 w-6 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Organization</p>
          <h2 className="mt-1 truncate text-2xl font-semibold text-slate-900">{organization.name}</h2>
          <p className="mt-2 text-sm text-slate-600">This workspace now uses your saved logo, colors, and font.</p>
        </div>
      </div>
    </div>
  )
}

export default OrgBrandHeader
