'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, CheckSquare, Clock, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod, Shift, ShiftAssignment } from '@/lib/types'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatTime } from '@/lib/utils'

export function EmployeeDashboard() {
  const { organization, member } = useOrg()
  const [collectingPeriods, setCollectingPeriods] = useState<SchedulingPeriod[]>([])
  const [myShifts, setMyShifts] = useState<(ShiftAssignment & { shifts: Shift })[]>([])
  const [pendingDrops, setPendingDrops] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (organization && member) loadData()
  }, [organization, member])

  async function loadData() {
    // Periods open for availability collection
    const { data: periods } = await supabase
      .from('scheduling_periods')
      .select('*')
      .eq('organization_id', organization!.id)
      .eq('status', 'collecting')
      .order('start_date', { ascending: true })

    // My upcoming assignments from published schedules
    const { data: assignments } = await supabase
      .from('shift_assignments')
      .select('*, shifts(*)')
      .eq('employee_id', member!.user_id)
      .eq('status', 'assigned')
      .in(
        'shift_id',
        supabase
          .from('shifts')
          .select('id')
          .in(
            'scheduling_period_id',
            supabase
              .from('scheduling_periods')
              .select('id')
              .eq('organization_id', organization!.id)
              .eq('status', 'published')
          )
      )
      .order('assigned_at', { ascending: true })
      .limit(10)

    // Pending drop requests
    const { count: drops } = await supabase
      .from('drop_requests')
      .select('id', { count: 'exact' })
      .eq('requested_by', member!.user_id)
      .eq('status', 'pending')

    setCollectingPeriods(periods || [])
    setMyShifts((assignments as any) || [])
    setPendingDrops(drops || 0)
    setLoading(false)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-0.5">{organization?.name}</p>
      </div>

      {/* Available periods to submit availability */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            Submit Availability
          </h2>
        </div>

        {loading ? (
          <div className="h-24 bg-slate-100 rounded-xl animate-pulse" />
        ) : collectingPeriods.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No shifts currently open for availability</p>
          </div>
        ) : (
          <div className="space-y-3">
            {collectingPeriods.map(period => (
              <div key={period.id} className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{period.name}</div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    {formatDate(period.start_date)} — {formatDate(period.end_date)}
                  </div>
                </div>
                <Link href={`/availability/${period.id}`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Submit Availability
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending drop requests */}
      {pendingDrops > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-amber-800 text-sm">
            You have {pendingDrops} pending drop request{pendingDrops !== 1 ? 's' : ''} awaiting manager review.
          </p>
        </div>
      )}

      {/* My upcoming shifts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            My Upcoming Shifts
          </h2>
          <Link href="/my-schedule" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Full schedule <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : myShifts.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No upcoming shifts assigned yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myShifts.map(assignment => (
              <div key={assignment.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: assignment.shifts?.color || '#3B82F6' }}
                  />
                  <div>
                    <div className="font-medium text-slate-900">{assignment.shifts?.label}</div>
                    <div className="text-sm text-slate-500">
                      {formatDate(assignment.shifts?.date)} · {formatTime(assignment.shifts?.start_time)} – {formatTime(assignment.shifts?.end_time)}
                    </div>
                  </div>
                </div>
                <Link href="/my-schedule">
                  <Button variant="outline" size="sm">View</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
