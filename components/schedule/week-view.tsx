'use client'

import { format, parseISO } from 'date-fns'
import { Plus, Users } from 'lucide-react'
import { Shift, ShiftAssignment, AvailabilityResponse, MemberWithProfile } from '@/lib/types'
import { formatTime, getStaffingStatus } from '@/lib/utils'
import { cn } from '@/lib/utils'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface WeekViewProps {
  days: string[]
  shifts: Shift[]
  assignments: (ShiftAssignment & { profiles?: any })[]
  availability: AvailabilityResponse[]
  members: MemberWithProfile[]
  canEdit: boolean
  onShiftClick: (shift: Shift) => void
  onAddShift: (date: string) => void
}

export function WeekView({ days, shifts, assignments, availability, members, canEdit, onShiftClick, onAddShift }: WeekViewProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Day headers */}
      <div className="grid border-b border-slate-100" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map(day => {
          const date = parseISO(day)
          const dow = date.getDay()
          const isToday = day === format(new Date(), 'yyyy-MM-dd')
          return (
            <div key={day} className="px-2 py-3 text-center border-r border-slate-100 last:border-r-0">
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{DAY_LABELS[dow]}</div>
              <div className={cn(
                'text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto',
                isToday ? 'bg-blue-600 text-white' : 'text-slate-900'
              )}>
                {format(date, 'd')}
              </div>
            </div>
          )
        })}
      </div>

      {/* Day cells */}
      <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
        {days.map(day => {
          const dayShifts = shifts.filter(s => s.date === day)
          return (
            <div key={day} className="border-r border-slate-100 last:border-r-0 min-h-[160px] p-2 flex flex-col gap-1.5">
              {dayShifts.map(shift => {
                const shiftAssignments = assignments.filter(a => a.shift_id === shift.id)
                const availCount = availability.filter(a => a.shift_id === shift.id && a.status === 'available').length
                const staffing = getStaffingStatus(shiftAssignments.length, shift.required_workers)

                return (
                  <button
                    key={shift.id}
                    onClick={() => onShiftClick(shift)}
                    className="w-full text-left rounded-lg overflow-hidden hover:opacity-90 transition-opacity border"
                    style={{ borderColor: shift.color + '40', backgroundColor: shift.color + '15' }}
                  >
                    <div className="h-1" style={{ backgroundColor: shift.color }} />
                    <div className="p-2">
                      <div className="text-xs font-semibold text-slate-800 leading-tight truncate">{shift.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatTime(shift.start_time)} – {formatTime(shift.end_time)}
                      </div>
                      {/* Staffing indicator */}
                      <div className="flex items-center justify-between mt-1.5 gap-1">
                        <div className={cn(
                          'text-xs px-1.5 py-0.5 rounded font-medium',
                          staffing === 'filled' ? 'bg-green-100 text-green-700' :
                          staffing === 'understaffed' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        )}>
                          {shiftAssignments.length}/{shift.required_workers}
                        </div>
                        {availCount > 0 && (
                          <div className="flex items-center gap-0.5 text-xs text-slate-500">
                            <Users className="w-3 h-3" />
                            {availCount}
                          </div>
                        )}
                      </div>
                      {/* Assigned names */}
                      {shiftAssignments.length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {shiftAssignments.slice(0, 2).map(a => (
                            <div key={a.id} className={cn('text-xs truncate', a.manual_name ? 'italic text-slate-500' : 'text-slate-700')}>
                              {a.manual_name || a.profiles?.full_name}
                            </div>
                          ))}
                          {shiftAssignments.length > 2 && (
                            <div className="text-xs text-slate-400">+{shiftAssignments.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}

              {canEdit && (
                <button
                  onClick={() => onAddShift(day)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-1 py-1 rounded hover:bg-slate-50 w-full mt-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add shift
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
