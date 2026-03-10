"use client"

export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="page-shell">
      {(title || subtitle || actions) ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-slate-600">{subtitle}</p>
            ) : null}
          </div>

          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      ) : null}

      {children}
    </div>
  )
}
