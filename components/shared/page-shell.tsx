"use client"

import { cn } from "@/lib/utils"

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("page-shell", className)}>
      {(title || subtitle || actions) ? (
        <div className="page-hero">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-2">
              {title ? (
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                  {title}
                </h1>
              ) : null}

              {subtitle ? (
                <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-[15px]">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="flex flex-wrap items-center gap-3">
                {actions}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-6">{children}</div>
    </div>
  )
}
