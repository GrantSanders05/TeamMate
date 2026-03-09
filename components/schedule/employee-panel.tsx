'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { MemberWithProfile, Shift, ShiftAssignment } from '@/lib/types'
import { calculateShiftHours, formatHours } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface EmployeePanelProps {
  members: MemberWithProfile[]
  assignments: ShiftAssignment[]
  shifts: Shift[]
}

export function EmployeePanel({ members, assignments, shifts }: EmployeePanelProps) {
  const [search, setSearch] = useState('')

  const employeeStats = useMemo(() => {
    return members.map(m => {
      const myAssignments = assignments.filter(a => a.employee_id === m.user_id && a.status === 'assigned')
      const totalHours = myAssignments.reduce((acc, a) => {
        const shift = shifts.find(s => s.id === a.shift_id)
        if (!shift) return acc
        return acc + calculateShiftHours(shift.start_time, shift.end_time)
      }, 0)
      return {
        member: m,
        shiftCount: myAssignments.length,
        totalHours,
      }
    })
  }, [members, assignments, shifts])

  const filtered = employeeStats.filter(({ member }) =>
    member.display_name.toLowerCase().includes(search.toLowerCase())
  )

  const maxHours = Math.max(...employeeStats.map(e => e.totalHours), 1)

  return (
    <div className="w-52 shrink-0 hidden lg:block">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-3 py-3 border-b border-slate-100">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Team</div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-7 text-xs"
            />
          </div>
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
          {filtered.map(({ member, shiftCount, totalHours }) => {
            const loadPercent = maxHours > 0 ? (totalHours / maxHours) * 100 : 0
            return (
              <div key={member.id} className="px-3 py-2.5 border-b border-slate-50 last:border-b-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-medium text-slate-900 truncate flex-1">{member.display_name}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{shiftCount} shift{shiftCount !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{formatHours(totalHours)}</span>
                </div>
                <div className="mt-1.5 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      loadPercent > 90 ? 'bg-red-400' :
                      loadPercent > 60 ? 'bg-amber-400' :
                      'bg-green-400'
                    )}
                    style={{ width: `${loadPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
