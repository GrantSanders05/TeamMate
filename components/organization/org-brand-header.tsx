"use client"

import { useOrgSafe } from "@/lib/hooks/use-org-safe"

type Props = {
  title?: string
  subtitle?: string
  compact?: boolean
}

export function OrgBrandHeader({ title, subtitle, compact = false }: Props) {
  const { organization } = useOrgSafe()

  if (!organization) return null

  const logoUrl = organization.logo_url || null
  const brandColor = organization.primary_color || "#2563EB"

  return (
    <div className={compact ? "rounded-xl border bg-white p-4 shadow-sm" : "rounded-2xl border bg-white p-5 shadow-sm md:p-6"}>
      <div className="flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50"
          style={{ borderColor: brandColor }}
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${organization.name} logo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-lg font-semibold text-white"
              style={{ backgroundColor: brandColor }}
            >
              {organization.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-slate-900 md:text-xl">
            {title || organization.name}
          </div>
          <div className="mt-1 truncate text-sm text-slate-600">
            {subtitle || "Professional team scheduling for your organization."}
          </div>
        </div>
      </div>
    </div>
  )
}
