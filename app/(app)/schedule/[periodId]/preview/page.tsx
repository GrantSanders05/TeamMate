'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useOrg } from '@/lib/hooks/use-organization'
import { createClient } from '@/lib/supabase/client'
import { SchedulingPeriod, Shift, ShiftAssignment } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { formatDate, formatDateFull, formatTime, getDaysInRange } from '@/lib/utils'

export default function PreviewPage() {
  const params = useParams()
  const periodId = params.periodId as string
  const { organization, isManager } = useOrg()
  const [period, setPeriod] = useState<SchedulingPeriod | null>(null)
  const [shifts, setShifts] = useState<Shift[]>([])
  const [assignments, setAssignments] = useState<(ShiftAssignment & { profiles?: any })[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => { loadData() }, [periodId])

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

  async function publish() {
    await supabase.from('scheduling_periods').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', periodId)
    toast({ title: 'Schedule published!' })
    router.push(`/schedule/${periodId}`)
  }

  const days = period ? getDaysInRange(period.start_date, period.end_date) : []
  if (loading || !period) return <div className="animate-pulse h-64 bg-slate-100 rounded-xl" />

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1.5" />Back</Button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{period.name} — Preview</h1>
            <p className="text-sm text-slate-500">{formatDate(period.start_date)} – {formatDate(period.end_date)}</p>
          </div>
        </div>
        {isManager && (
          <Button onClick={publish} className="bg-green-600 hover:bg-green-700">
            <Send className="w-4 h-4 mr-2" />Publish Schedule
          </Button>
        )}
      </div>

      <div className="rounded-xl p-4 text-white" style={{ backgroundColor: organization?.primary_color || '#2563EB' }}>
        {organization?.logo_url && <img src={organization.logo_url} alt="" className="h-8 mb-2 rounded" />}
        <div className="font-bold text-lg">{period.name}</div>
        <div className="text-sm opacity-80">{organization?.name} · {formatDate(period.start_date)} – {formatDate(period.end_date)}</div>
      </div>

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
                  return (
                    <div key={shift.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: shift.color }} />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 text-sm">{shift.label}</div>
                        <div className="text-xs text-slate-500">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</div>
                        {shiftAssignments.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {shiftAssignments.map(a => (
                              <span key={a.id} className={`text-xs px-2 py-0.5 rounded-full ${a.manual_name ? 'bg-slate-100 text-slate-500 italic' : 'bg-blue-50 text-blue-700'}`}>
                                {a.manual_name || a.profiles?.full_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-red-400 mt-1 block">⚠ No one assigned</span>
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
    </div>
  )
}
