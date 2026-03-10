"use client";

export function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      {title || subtitle || actions ? (
        <div className="app-surface app-section-header">
          <div className="space-y-1">
            {title ? <h1 className="app-title">{title}</h1> : null}
            {subtitle ? <p className="app-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-6">{children}</div>
    </div>
  );
}
