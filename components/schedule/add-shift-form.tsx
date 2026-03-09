"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { ShiftType } from "@/lib/types"
import { formatDateFull } from "@/lib/utils"

interface AddShiftFormProps {
  date: string
  shiftTypes: ShiftType[]
  onAdd: (shift: Record<string, unknown>) => void
  onClose: () => void
}

export function AddShiftForm({ date, shiftTypes, onAdd, onClose }: AddShiftFormProps) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Shift — {formatDateFull(date)}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">This form is temporarily simplified. {shiftTypes.length} shift type(s) loaded.</p>
        <div className="flex justify-end">
          <Button onClick={() => onAdd({ date })}>Add placeholder shift</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
