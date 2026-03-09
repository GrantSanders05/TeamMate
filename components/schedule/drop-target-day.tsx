"use client"

export function DropTargetDay({
  date,
  onShiftDrop,
  children,
}: {
  date: string
  onShiftDrop: (shiftId: string, newDate: string) => void
  children: React.ReactNode
}) {
  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const shiftId = event.dataTransfer.getData("text/plain")
        if (!shiftId) return
        onShiftDrop(shiftId, date)
      }}
      className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
    >
      {children}
    </div>
  )
}
