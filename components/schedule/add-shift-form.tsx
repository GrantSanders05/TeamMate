'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShiftType } from '@/lib/types'
import { formatDateFull } from '@/lib/utils'
import { SHIFT_COLORS } from '@/lib/constants'

interface AddShiftFormProps {
  date: string
  shiftTypes: ShiftType[]
  onAdd: (shift: any) => void
  onClose: () => void
}

export function AddShiftForm({ date, shiftTypes, onAdd, onClose }: AddShiftFormProps) {
  const [mode, setMode] = useState<'template' | 'custom'>(shiftTypes.length > 0 ? 'template' : 'custom')
  const [selectedTypeId, setSelectedTypeId] = useState(shiftTypes[0]?.id || '')
  const [label, setLabel] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [color, setColor] = useState('#3B82F6')
  const [required, setRequired] = useState(1)
  const [notes, setNotes] = useState('')

  function handleSubmit() {
    if (mode === 'template') {
      const type = shiftTypes.find(t => t.id === selectedTypeId)
      if (!type) return
      onAdd({
        date,
        shift_type_id: type.id,
        label: type.name,
        start_time: type.start_time,
        end_time: type.end_time,
        color: type.color,
        required_workers: required,
        notes: notes || null,
      })
    } else {
      if (!label || !startTime || !endTime) return
      onAdd({
        date,
        label,
        start_time: startTime,
        end_time: endTime,
        color,
        required_workers: required,
        notes: notes || null,
      })
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Shift — {formatDateFull(date)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Mode toggle */}
          {shiftTypes.length > 0 && (
            <div className="flex border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setMode('template')}
                className={`flex-1 py-2 text-sm font-medium ${mode === 'template' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                From template
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex-1 py-2 text-sm font-medium ${mode === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Custom
              </button>
            </div>
          )}

          {mode === 'template' ? (
            <div className="space-y-1.5">
              <Label>Shift template</Label>
              <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                        {t.name} ({t.start_time.slice(0,5)}–{t.end_time.slice(0,5)})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Shift name</Label>
                <Input placeholder="e.g. Morning shift" value={label} onChange={e => setLabel(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Start time</Label>
                  <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>End time</Label>
                  <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex gap-2 flex-wrap">
                  {SHIFT_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-slate-900 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <Label>Workers required</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={required}
              onChange={e => setRequired(parseInt(e.target.value) || 1)}
              className="w-24"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Input placeholder="Any special instructions..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} className="flex-1 bg-blue-600 hover:bg-blue-700">Add shift</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
