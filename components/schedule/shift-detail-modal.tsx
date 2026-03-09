'use client'

import { useState } from 'react'
import { X, Trash2, Plus, UserCheck, UserX, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Shift, ShiftAssignment, AvailabilityResponse, MemberWithProfile } from '@/lib/types'
import { formatTime, formatDateFull, calculateShiftHours, formatHours } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/confirmation-dialog'

interface ShiftDetailModalProps {
  shift: Shift
  members: MemberWithProfile[]
  assignments: (ShiftAssignment & { profiles?: any })[]
  availability: AvailabilityResponse[]
  canEdit: boolean
  onClose: () => void
  onAssign: (employeeId: string) => void
  onUnassign: (assignmentId: string) => void
  onAddManual: (name: string) => void
  onDelete: () => void
}

export function ShiftDetailModal({
  shift, members, assignments, availability, canEdit,
  onClose, onAssign, onUnassign, onAddManual, onDelete
}: ShiftDetailModalProps) {
  const [manualName, setManualName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const assignedIds = assignments.map(a => a.employee_id).filter(Boolean)
  const availableMembers = members.filter(m => availability.some(a => a.employee_id === m.user_id && a.status === 'available'))
  const unavailableMembers = members.filter(m => availability.some(a => a.employee_id === m.user_id && a.status === 'unavailable'))
  const noResponseMembers = members.filter(m => !availability.some(a => a.employee_id === m.user_id))

  const hours = calculateShiftHours(shift.start_time, shift.end_time)

  function handleAddManual() {
    if (manualName.trim()) {
      onAddManual(manualName.trim())
      setManualName('')
    }
  }

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: shift.color }} />
                  <DialogTitle>{shift.label}</DialogTitle>
                </div>
                <p className="text-sm text-slate-500">
                  {formatDateFull(shift.date)} · {formatTime(shift.start_time)} – {formatTime(shift.end_time)} · {formatHours(hours)}
                </p>
              </div>
              {canEdit && (
                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 -mt-1" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Assigned */}
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Assigned ({assignments.length}/{shift.required_workers} required)
              </div>
              {assignments.length === 0 ? (
                <p className="text-sm text-slate-400 italic">No one assigned yet</p>
              ) : (
                <div className="space-y-1.5">
                  {assignments.map(a => (
                    <div key={a.id} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                      <span className={`text-sm font-medium ${a.manual_name ? 'italic text-slate-600' : 'text-slate-900'}`}>
                        {a.manual_name || a.profiles?.full_name}
                        {a.manual_name && <span className="text-xs ml-1 not-italic">(manual)</span>}
                      </span>
                      {canEdit && (
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-red-600 hover:bg-red-100 px-2" onClick={() => onUnassign(a.id)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available */}
            {canEdit && availableMembers.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Available ({availableMembers.length})
                </div>
                <div className="space-y-1.5">
                  {availableMembers.map(m => {
                    const isAssigned = assignedIds.includes(m.user_id)
                    return (
                      <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 bg-slate-50">
                        <span className="text-sm text-slate-700">{m.display_name}</span>
                        {!isAssigned ? (
                          <Button size="sm" className="h-6 text-xs bg-green-600 hover:bg-green-700 px-2" onClick={() => onAssign(m.user_id)}>
                            Assign
                          </Button>
                        ) : (
                          <span className="text-xs text-green-600 font-medium">Assigned</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Unavailable */}
            {unavailableMembers.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5" />
                  Unavailable ({unavailableMembers.length})
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  {unavailableMembers.map(m => (
                    <div key={m.id} className="px-3 py-1.5">{m.display_name}</div>
                  ))}
                </div>
              </div>
            )}

            {/* No response */}
            {noResponseMembers.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  No response ({noResponseMembers.length})
                </div>
                <div className="space-y-1 text-sm text-slate-400">
                  {noResponseMembers.slice(0, 5).map(m => (
                    <div key={m.id} className="px-3 py-1.5 flex items-center justify-between">
                      {m.display_name}
                      {canEdit && (
                        <Button size="sm" variant="ghost" className="h-6 text-xs px-2" onClick={() => onAssign(m.user_id)}>
                          Assign anyway
                        </Button>
                      )}
                    </div>
                  ))}
                  {noResponseMembers.length > 5 && <div className="px-3 text-xs">+{noResponseMembers.length - 5} more</div>}
                </div>
              </div>
            )}

            {/* Manual write-in */}
            {canEdit && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Add by name</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a name..."
                    value={manualName}
                    onChange={e => setManualName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                    className="text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleAddManual}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {shift.notes && (
              <div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</div>
                <p className="text-sm text-slate-600">{shift.notes}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete shift"
        description={`Delete "${shift.label}" on ${formatDateFull(shift.date)}? This will also remove all assignments and availability responses.`}
        confirmLabel="Delete shift"
        variant="destructive"
        onConfirm={onDelete}
      />
    </>
  )
}
