"use client"

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-5/6 rounded bg-slate-100" />
      </div>
      <div className="mt-4 text-sm text-slate-500">{label}</div>
    </div>
  )
}
