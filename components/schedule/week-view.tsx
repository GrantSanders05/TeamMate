'use client'

import { format, parseISO } from 'date-fns'
import { Plus, Users } from 'lucide-react'
import { Shift, ShiftAssignment, AvailabilityResponse, MemberWithProfile } from '@/lib/types'
import { formatTime, getStaffingStatus, cn } from '@/lib/utils'

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

function staffingClasses(status: ReturnType<typeof getStaffingStatus>) {
  if (status === 'filled') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'overstaffed') return 'border-amber-200 bg-amber-50 text-amber-700'
  return 'border-rose-200 bg-rose-50 text-rose-700'
}

export function WeekView({ days, shifts, assignments, availability, members, canEdit, onShiftClick, onAddShift }: WeekViewProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[1220px] rounded-3xl border border-slate-200 bg-white p-4 shadow-sm xl:min-w-0">
        <div className="grid grid-cols-7 gap-4">
          {days.map((day) => {
            const date = parseISO(day)
            const dow = date.getDay()
            const isToday = day === format(new Date(), 'yyyy-MM-dd')

            return (
              <div
                key={`header-${day}`}
                className={cn(
                  'rounded-2xl border px-4 py-3',
                  isToday ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50/80',
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
                  {DAY_LABELS[dow]}
                </div>
                <div className="mt-1 text-base font-semibold text-slate-900">{format(date, 'MMM d')}</div>
              </div>
            )
          })}

          {days.map((day) => {
            const dayShifts = shifts.filter((s) => s.date === day)

            return (
              <div key={day} className="flex min-h-[440px] flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
                {dayShifts.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    No shifts yet
                  </div>
                ) : (
                  dayShifts.map((shift) => {
                    const shiftAssignments = assignments.filter((a) => a.shift_id === shift.id)
                    const availCount = availability.filter((a) => a.shift_id === shift.id && a.status === 'available').length
                    const staffing = getStaffingStatus(shiftAssignments.length, shift.required_workers)

                    return (
                      <button
                        key={shift.id}
                        type="button"
                        onClick={() => onShiftClick(shift)}
                        className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="h-1.5 w-12 rounded-full" style={{ backgroundColor: shift.color || '#2563EB' }} />
                            <div className="mt-3 text-sm font-semibold text-slate-900">{shift.label}</div>
                            <div className="mt-1 text-sm text-slate-600">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</div>
                          </div>
                          <div className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', staffingClasses(staffing))}>
                            {shiftAssignments.length}/{shift.required_workers}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <Users className="h-3.5 w-3.5" />
                          {availCount > 0 ? `${availCount} available` : 'No availability submitted'}
                        </div>

                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                          {shiftAssignments.length > 0 ? (
                            shiftAssignments.slice(0, 3).map((a) => {
                              const display = a.manual_name || a.profiles?.full_name || members.find((m) => m.user_id === a.employee_id)?.display_name || 'Assigned'
                              return (
                                <div key={a.id} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                                  {display}
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-xs text-slate-400">No one assigned yet</div>
                          )}

                          {shiftAssignments.length > 3 ? (
                            <div className="text-xs font-medium text-slate-500">+{shiftAssignments.length - 3} more</div>
                          ) : null}
                        </div>
                      </button>
                    )
                  })
                )}

                {canEdit ? (
                  <button
                    type="button"
                    onClick={() => onAddShift(day)}
                    className="mt-auto flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add shift
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
