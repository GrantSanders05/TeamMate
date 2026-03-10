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
    <section className={["rounded-2xl border border-slate-200 bg-white p-5 shadow-sm", className].join(" ")}>
      {(title || description) ? (
        <div className="mb-4">
          {title ? <h2 className="text-lg font-semibold text-slate-900">{title}</h2> : null}
          {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  )
}
