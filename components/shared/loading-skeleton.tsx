export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-200 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-28 bg-slate-100 rounded-xl" />
        ))}
      </div>
      <div className="space-y-3">
        {[1,2,3].map(i => (
          <div key={i} className="h-20 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}
