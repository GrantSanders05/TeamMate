'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Printer, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod, Shift, ShiftAssignment } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatDateFull, formatTime, getDaysInRange } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function MySchedulePeriodPage() {
  const params = useParams()
  const periodId = params.periodId as string
  const { organization, member } = useOrg()
  const [period, setPeriod] = useState<SchedulingPeriod | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<(ShiftAssignment & { profiles?: any })[]>([])
  const [dropRequest, setDropRequest] = useState<{ assignmentId: string; shiftLabel: string } | null>(null)
  const [dropReason, setDropReason] = useState('')
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => { if (member) loadData() }, [member, periodId])

  async function loadData() {
    const { data: periodData } = await supabase.from('scheduling_periods').select('*').eq('id', periodId).single()
    const { data: shiftsData } = await supabase.from('shifts').select('*').eq('scheduling_period_id', periodId).order('date').order('start_time')
    const shiftIds = (shiftsData || []).map((s: any) => s.id)
    let assignData: any[] = []
    if (shiftIds.length > 0) {
      const { data } = await supabase.from('shift_assignments').select('*, profiles(*)').in('shift_id', shiftIds).eq('status', 'assigned')
      assignData = data || []
    }
    setPeriod(periodData)
    setShifts(shiftsData || [])
    setAssignments(assignData)
    setLoading(false)
  }

  async function submitDropRequest() {
    if (!dropRequest || !member) return
    const { error } = await supabase.from('drop_requests').insert({
      assignment_id: dropRequest.assignmentId,
      requested_by: member.user_id,
      reason: dropReason || null,
      status: 'pending',
    })
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    toast({ title: 'Drop request submitted', description: 'Your manager will review your request.' })
    setDropRequest(null)
    setDropReason('')
  }

  const days = period ? getDaysInRange(period.start_date, period.end_date) : []
  const myAssignments = assignments.filter(a => a.employee_id === member?.user_id)

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-10 bg-slate-100 rounded w-64" /><div className="h-64 bg-slate-100 rounded-xl" /></div>
  if (!period) return <div className="text-center py-20 text-slate-500">Schedule not found</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{period.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5">{formatDate(period.start_date)} — {formatDate(period.end_date)}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1.5" />Print
        </Button>
      </div>

      {myAssignments.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-800">You have {myAssignments.length} shift{myAssignments.length !== 1 ? 's' : ''} this period</p>
        </div>
      )}

      <div className="space-y-4">
        {days.map(day => {
          const dayShifts = shifts.filter(s => s.date === day)
          if (dayShifts.length === 0) return null
          return (
            <div key={day} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 text-sm">{formatDateFull(day)}</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {dayShifts.map(shift => {
                  const shiftAssignments = assignments.filter(a => a.shift_id === shift.id)
                  const myAssignment = shiftAssignments.find(a => a.employee_id === member?.user_id)
                  return (
                    <div key={shift.id} className={`px-4 py-4 ${myAssignment ? 'bg-blue-50/30' : ''}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: shift.color }} />
                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              {shift.label}
                              {myAssignment && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">You</span>}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</div>
                            {shiftAssignments.length > 0 && (
                              <div className="text-xs text-slate-400 mt-1.5 flex flex-wrap gap-1">
                                {shiftAssignments.map((a, i) => (
                                  <span key={a.id}>{i > 0 && ', '}<span className={a.manual_name ? 'italic' : ''}>{a.manual_name || a.profiles?.full_name}</span></span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {myAssignment && period.status === 'published' && (
                          <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 flex-shrink-0"
                            onClick={() => setDropRequest({ assignmentId: myAssignment.id, shiftLabel: shift.label })}>
                            <AlertCircle className="w-3.5 h-3.5 mr-1" />Request drop
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {dropRequest && (
        <Dialog open onOpenChange={() => setDropRequest(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Request shift drop</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <p className="text-sm text-slate-600">Submit a request to drop <strong>{dropRequest.shiftLabel}</strong>. Your manager will review it.</p>
              <div className="space-y-1.5">
                <Label>Reason (optional)</Label>
                <Textarea placeholder="Briefly explain why..." value={dropReason} onChange={e => setDropReason(e.target.value)} rows={3} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setDropRequest(null)} className="flex-1">Cancel</Button>
                <Button onClick={submitDropRequest} className="flex-1 bg-red-600 hover:bg-red-700">Submit request</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
