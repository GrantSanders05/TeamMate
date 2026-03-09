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
  const secondary = organization.secondary_color || "#1E40AF"

  return (
    <div
      className={
        compact
          ? "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
          : "overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm"
      }
    >
      <div
        className="h-2 w-full"
        style={{
          background: `linear-gradient(90deg, ${brandColor}, ${secondary})`,
        }}
      />
      <div className="p-5 md:p-6">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50 shadow-sm"
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
                className="flex h-full w-full items-center justify-center text-xl font-semibold text-white"
                style={{
                  background: `linear-gradient(135deg, ${brandColor}, ${secondary})`,
                }}
              >
                {organization.name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-xl font-semibold text-slate-900 md:text-2xl">
              {title || organization.name}
            </div>
            <div className="mt-1 truncate text-sm text-slate-600">
              {subtitle || "Professional team scheduling for your organization."}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
