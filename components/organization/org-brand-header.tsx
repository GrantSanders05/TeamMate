"use client"

import { Sparkles } from "lucide-react"

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
  const secondary = organization.secondary_color || "#1D4ED8"

  return (
    <div className={compact ? "brand-panel p-4" : "brand-panel p-5 sm:p-6"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          {logoUrl ? (
            <img
              alt={`${organization.name} logo`}
              className={compact ? "h-12 w-12 rounded-2xl border border-white/80 bg-white object-cover shadow-sm" : "h-14 w-14 rounded-[20px] border border-white/80 bg-white object-cover shadow-sm"}
              src={logoUrl}
            />
          ) : (
            <div
              className={compact ? "flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm" : "flex h-14 w-14 items-center justify-center rounded-[20px] text-xl font-semibold text-white shadow-sm"}
              style={{ background: `linear-gradient(135deg, ${brandColor}, ${secondary})` }}
            >
              {organization.name.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <div className="pill-badge mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Organization Brand
            </div>
            <h2 className="truncate text-2xl font-semibold tracking-tight text-slate-950">
              {title || organization.name}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {subtitle || "Professional team scheduling for your organization."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
