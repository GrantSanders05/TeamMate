"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function ShiftDetailModal({
  open = false,
  onOpenChange = () => {},
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Shift Details</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">Temporarily simplified in this patch.</p>
      </DialogContent>
    </Dialog>
  )
}
