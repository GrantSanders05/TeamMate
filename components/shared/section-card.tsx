"use client"

import { cn } from "@/lib/utils"

export function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("section-card", className)}>
      {(title || description) ? (
        <div className="mb-4 flex flex-col gap-1.5">
          {title ? (
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
          ) : null}

          {description ? (
            <p className="text-sm leading-6 text-slate-600">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  )
}
