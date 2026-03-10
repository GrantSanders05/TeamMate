"use client";

export function SectionCard({
  title,
  description,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`app-panel overflow-hidden ${className}`.trim()}>
      {title || description ? (
        <div className="border-b border-slate-100 px-6 py-5">
          {title ? (
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}
