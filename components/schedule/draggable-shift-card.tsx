"use client"

export function DraggableShiftCard({
  shiftId,
  label,
  timeLabel,
  assignedCount,
}: {
  shiftId: string
  label: string
  timeLabel: string
  assignedCount: string
}) {
  return (
    <div
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", shiftId)
      }}
      className="cursor-grab rounded-2xl border border-slate-200 bg-white p-3 shadow-sm active:cursor-grabbing"
    >
      <div className="font-medium text-slate-900">{label}</div>
      <div className="mt-1 text-xs text-slate-600">{timeLabel}</div>
      <div className="mt-2 text-xs text-slate-500">{assignedCount}</div>
    </div>
  )
}
