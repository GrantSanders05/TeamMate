"use client"

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
    <section className={`section-card ${className}`.trim()}>
      {(title || description) ? (
        <div className="mb-4 space-y-1">
          {title ? (
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          ) : null}
          {description ? (
            <p className="text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
      ) : null}

      {children}
    </section>
  )
}
